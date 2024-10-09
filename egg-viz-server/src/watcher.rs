use futures::SinkExt;
use notify::{Config, RecursiveMode, Watcher};
use std::ffi::OsStr;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::os::unix::fs::MetadataExt;
use std::path::{Path, PathBuf};
use std::time::Duration;

use futures::channel::mpsc::{channel, Receiver, Sender};
use notify::{Event, RecommendedWatcher};

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct Row {
    id: String,
    iteration: u64,
    rule_name: String,
    rule: String,
    when: String,
    name: String,
    value: String,
}

#[derive(serde::Serialize, Debug)]
pub enum RowResponse {
    Located { path: PathBuf, row: Row, order: u64 },
    Restart { path: PathBuf },
}

impl Row {
    fn locate(self, path: PathBuf) -> RowResponse {
        RowResponse::Located {
            path,
            row: self,
            order: 0,
        }
    }
}

impl RowResponse {
    fn order(self, order: u64) -> Self {
        match self {
            RowResponse::Located {
                path,
                row,
                order: _,
            } => RowResponse::Located { path, row, order },
            RowResponse::Restart { path } => RowResponse::Restart { path },
        }
    }
}

pub fn async_watcher(
    path: impl AsRef<Path>,
) -> notify::Result<(RecommendedWatcher, Receiver<RowResponse>)> {
    let (mut tx, rx) = channel(1);

    // keep track of file sizes so that we can just read new contents
    let mut filesize: u64 = 0;
    let mut count: u64 = 0;

    // Automatically select the best implementation for your platform.
    // You can also access each implementation directly e.g. INotifyWatcher.
    let mut watcher = RecommendedWatcher::new(
        move |res| {
            futures::executor::block_on(async {
                if let Err(e) = parse_event(res, &mut tx, &mut filesize, &mut count).await {
                    eprintln!("parse_event error: {e:?}");
                }
            })
        },
        Config::default()
            .with_poll_interval(Duration::from_secs(5))
            .with_compare_contents(true),
    )?;

    watcher.watch(path.as_ref(), RecursiveMode::NonRecursive)?;

    Ok((watcher, rx))
}

async fn parse_event(
    event: notify::Result<Event>,
    sender: &mut Sender<RowResponse>,
    old_filesize: &mut u64,
    count: &mut u64,
) -> anyhow::Result<()> {
    match event {
        Ok(event) => {
            if event.attrs.info() == Some("is: symlink") {
                return Ok(());
            }

            for p in event
                .paths
                .iter()
                .filter(|path| path.extension().and_then(OsStr::to_str) == Some("csv"))
            {
                let mut f = File::open(p)?;
                let filesize = f.metadata()?.size();

                let seek_pos = match (*old_filesize).cmp(&filesize) {
                    std::cmp::Ordering::Less => SeekFrom::Start(*old_filesize),
                    std::cmp::Ordering::Equal => {
                        // file size hasn't changed so we don't have to do anythhing
                        continue;
                    }
                    std::cmp::Ordering::Greater => {
                        *count = 0;
                        sender
                            .send(RowResponse::Restart { path: p.clone() })
                            .await?;
                        SeekFrom::Start(0)
                    }
                };

                f.seek(seek_pos)?;

                let mut new_contents = Vec::new();
                f.read_to_end(&mut new_contents)?;

                let mut rdr = csv::ReaderBuilder::new()
                    .has_headers(false)
                    .delimiter(b',')
                    .from_reader(&new_contents[..]);
                for row in rdr.deserialize::<Row>().flatten() {
                    sender.send(row.locate(p.clone()).order(*count)).await?;
                    *count += 1;
                }

                *old_filesize = filesize;
            }
        }
        Err(e) => eprintln!("watch error: {:?}", e),
    }

    Ok(())
}

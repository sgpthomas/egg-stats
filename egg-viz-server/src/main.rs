mod cli;
mod handlers;
mod watcher;
#[cfg(not(debug_assertions))]
mod webfiles;

use anyhow::anyhow;
use itertools::Itertools;
use std::{
    collections::{HashMap, HashSet},
    convert::Infallible,
    ffi::OsStr,
    fs,
    path::{Path, PathBuf},
    sync::{Arc, RwLock},
    time::SystemTime,
};

use handlers::{available, download, ws};
use walkdir::{DirEntry, WalkDir};
use warp::Filter;

pub trait HasExtension {
    fn has_extension(&self, extension: impl AsRef<str>) -> bool;
}

impl HasExtension for Path {
    fn has_extension(&self, extension: impl AsRef<str>) -> bool {
        self.extension().and_then(OsStr::to_str) == Some(extension.as_ref())
    }
}

impl HasExtension for DirEntry {
    fn has_extension(&self, extension: impl AsRef<str>) -> bool {
        self.path().has_extension(extension)
    }
}

#[derive(Clone)]
pub struct KnownFiles {
    root: Arc<PathBuf>,
    excluded: Arc<Vec<String>>,
    counter: Arc<RwLock<usize>>,
    paths: Arc<RwLock<HashMap<PathBuf, (bool, usize)>>>,
}

impl KnownFiles {
    fn new(p: impl AsRef<Path>, excluded: &[String]) -> Self {
        KnownFiles {
            root: Arc::new(p.as_ref().to_path_buf()),
            excluded: Arc::new(excluded.to_vec()),
            counter: Arc::new(RwLock::new(0)),
            paths: Arc::default(),
        }
    }

    fn generate(&self) -> anyhow::Result<()> {
        let mut counter = self.counter.write().map_err(|e| anyhow!("{e}"))?;
        let mut paths = self.paths.write().map_err(|e| anyhow!("{e}"))?;

        // find all csv paths under `&self.root`
        let csv_paths: Vec<(PathBuf, SystemTime)> = WalkDir::new(&*self.root)
            .into_iter()
            .flatten()
            .filter(|entry| entry.file_type().is_file())
            .filter(|entry| entry.has_extension("csv"))
            .filter(|entry| {
                !self
                    .excluded
                    .iter()
                    .any(|excl| entry.path().ends_with(excl))
            })
            .map(|entry| entry.into_path())
            .map(|path| {
                let metadata = fs::metadata(&path)
                    .and_then(|metadata| metadata.modified())
                    .unwrap();
                (path, metadata)
            })
            .flat_map(|(path, ts)| {
                path.strip_prefix(&*self.root)
                    .map(|p| (p.to_path_buf(), ts))
            })
            .collect();

        // check all the paths that we know, updating whether they are present
        for (path, (present, _id)) in paths.iter_mut() {
            *present = csv_paths.iter().any(|(p, _ts)| path == p);
        }

        // add all new files
        for (csv_path, _ts) in csv_paths.into_iter().sorted_by_key(|(_, ts)| *ts) {
            paths.entry(csv_path).or_insert_with(|| {
                let res = (true, *counter);
                *counter += 1;
                res
            });
        }

        Ok(())
    }

    fn get_path(&self, file_id: usize) -> anyhow::Result<PathBuf> {
        self.paths
            .read()
            .map_err(|e| anyhow!("{e}"))?
            .iter()
            .find_map(|(path, (pres, id))| {
                if *pres && file_id == *id {
                    Some(path.clone())
                } else {
                    None
                }
            })
            .ok_or(anyhow!("{file_id} does not correspond to a known file"))
    }
}

#[tokio::main]
async fn main() {
    let args = cli::cli();

    let known_files = KnownFiles::new(&args.input, &args.exclude);

    let available = warp::path("available")
        .and(with_known_files(known_files.clone()))
        .and_then(available::handler);

    let download_headers = warp::path!("download_headers" / usize)
        .and(with_known_files(known_files.clone()))
        .and(with_root(args.clone()))
        .and_then(download::header_handler);

    let download = warp::path!("download" / usize)
        .and(with_known_files(known_files.clone()))
        .and(with_root(args.clone()))
        .and_then(download::body_handler);

    let ws_route = warp::path!("ws" / usize)
        .and(warp::ws())
        .and(with_known_files(known_files.clone()))
        .and_then(ws::handler);

    let routes = available.or(download_headers).or(download).or(ws_route);

    #[cfg(not(debug_assertions))]
    {
        println!("production mode");
        let routes = routes
            .or(webfiles::routes())
            .or(webfiles::index_route())
            .with(warp::cors().allow_any_origin());

        if !args.quiet
            && webbrowser::open(&format!("http://localhost:{p}/reset/{p}", p = args.port)).is_err()
        {
            println!("Unable to open webbrowser.");
            println!("Server is running on `http://localhost:{}", args.port);
        }

        warp::serve(routes).run(([127, 0, 0, 1], args.port)).await;
        return;
    }

    #[cfg(debug_assertions)]
    {
        println!("development mode");

        let routes = routes.with(warp::cors().allow_any_origin());

        if args.external
            && webbrowser::open(&format!(
                "http://localhost:{}/reset/{}",
                args.dev_port, args.port
            ))
            .is_err()
        {
            println!("Unable to open webbrowser.");
            println!("Server is running on `http://localhost:{}", args.port);
        }

        warp::serve(routes).run(([127, 0, 0, 1], args.port)).await;
        return;
    }
}

#[allow(unused)]
fn with_root(args: cli::Args) -> impl Filter<Extract = (PathBuf,), Error = Infallible> + Clone {
    warp::any().map(move || args.input.clone())
}

fn with_known_files(
    known_files: KnownFiles,
) -> impl Filter<Extract = (KnownFiles,), Error = Infallible> + Clone {
    warp::any().map(move || known_files.clone())
}

mod cli;
mod handlers;
mod watcher;

use std::{
    convert::Infallible,
    ffi::OsStr,
    path::{Path, PathBuf},
    sync::Arc,
};

use handlers::{available, download, ws};
use walkdir::WalkDir;
use warp::Filter;

pub struct KnownFiles {
    paths: Vec<PathBuf>,
}

impl KnownFiles {
    fn generate(root: impl AsRef<Path>) -> Self {
        KnownFiles {
            paths: WalkDir::new(root.as_ref())
                .into_iter()
                .flatten()
                .filter(|entry| entry.file_type().is_file())
                .filter(|entry| entry.path().extension().and_then(OsStr::to_str) == Some("csv"))
                .map(|entry| entry.into_path())
                .flat_map(|path| path.strip_prefix(root.as_ref()).map(|p| p.to_path_buf()))
                .collect::<Vec<_>>(),
        }
    }
}

#[tokio::main]
async fn main() {
    let args = cli::cli();

    let known_files = Arc::new(KnownFiles::generate(&args.input));

    let available = warp::path("available")
        .and(with_known_files(known_files.clone()))
        .and_then(available::handler);

    let download = warp::path!("download" / usize)
        .and(with_known_files(known_files.clone()))
        .and(with_root(args.clone()))
        .and_then(download::handler);

    let ws_route = warp::path!("ws" / usize)
        .and(warp::ws())
        .and(with_known_files(known_files.clone()))
        .and_then(ws::handler);

    let routes = available
        .or(download)
        .or(ws_route)
        .with(warp::cors().allow_any_origin());

    warp::serve(routes).run(([127, 0, 0, 1], 8080)).await;
}

#[allow(unused)]
fn with_root(args: cli::Args) -> impl Filter<Extract = (PathBuf,), Error = Infallible> + Clone {
    warp::any().map(move || args.input.clone())
}

fn with_known_files(
    known_files: Arc<KnownFiles>,
) -> impl Filter<Extract = (Arc<KnownFiles>,), Error = Infallible> + Clone {
    warp::any().map(move || known_files.clone())
}

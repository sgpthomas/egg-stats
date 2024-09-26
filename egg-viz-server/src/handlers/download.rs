use warp::{
    reject::{self, Rejection},
    reply::{json, Reply},
};

use std::{path::PathBuf, sync::Arc};

use crate::{watcher::Row, KnownFiles};

#[derive(serde::Serialize, Debug)]
pub struct FileResponse {
    path: PathBuf,
    rows: Vec<Row>,
}

pub async fn handler(
    file_id: usize,
    known_files: Arc<KnownFiles>,
    root: PathBuf,
) -> Result<impl Reply, Rejection> {
    println!("request to download {file_id}");

    let path = known_files
        .paths
        .get(file_id)
        .ok_or(reject::not_found())?
        .clone();

    println!("  found {path:?}");

    let mut rdr = csv::ReaderBuilder::new()
        .has_headers(false)
        .delimiter(b',')
        .from_path(root.join(&path))
        .map_err(|_| reject::not_found())?;

    println!("  made reader");

    let rows = rdr.deserialize::<Row>().flatten().collect::<Vec<_>>();

    println!("  sent!");

    Ok(json(&FileResponse { path, rows }))
}

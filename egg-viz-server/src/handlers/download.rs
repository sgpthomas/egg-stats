use warp::{
    reject::{self, Rejection},
    reply::{json, Reply},
};

use std::path::PathBuf;

use crate::KnownFiles;

type Row = Vec<String>;

#[derive(serde::Serialize, Debug)]
pub struct FileResponse {
    path: PathBuf,
    headers: Vec<String>,
    rows: Vec<Row>,
}

pub async fn handler(
    file_id: usize,
    known_files: KnownFiles,
    root: PathBuf,
) -> Result<impl Reply, Rejection> {
    let path = known_files
        .get_path(file_id)
        .map_err(|_| reject::not_found())?
        .clone();

    let mut rdr = csv::ReaderBuilder::new()
        .has_headers(true)
        .delimiter(b',')
        .from_path(root.join(&path))
        .map_err(|_| reject::not_found())?;

    let rows = rdr.deserialize::<Row>().flatten().collect::<Vec<_>>();

    let headers: Vec<String> = rdr
        .headers()
        .map_err(|_| reject::reject())?
        .into_iter()
        .map(|s| s.to_string())
        .collect();

    Ok(json(&FileResponse {
        path,
        headers,
        rows,
    }))
}

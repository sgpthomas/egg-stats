use warp::{
    reject::{self, Rejection},
    reply::{json, Reply},
};

use std::path::PathBuf;

use crate::KnownFiles;

type Row = Vec<String>;

#[derive(serde::Serialize, Debug)]
pub struct HeaderResponse {
    path: PathBuf,
    headers: Vec<String>,
}

pub async fn header_handler(
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

    let headers: Vec<String> = rdr
        .headers()
        .map_err(|_| reject::reject())?
        .into_iter()
        .map(|s| s.to_string())
        .collect();

    let response = HeaderResponse { path, headers };

    Ok(json(&response))
}

pub async fn body_handler(
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

    let rows = rdr
        .deserialize::<Row>()
        .flatten()
        .map(|row| row.join(","))
        .collect::<Vec<_>>();

    Ok(rows.join("\n"))
}

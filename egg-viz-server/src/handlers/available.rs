use std::{path::PathBuf, sync::Arc};

use warp::{
    reject::Rejection,
    reply::{json, Reply},
};

use crate::KnownFiles;

#[derive(serde::Serialize)]
struct AvailableResponse {
    paths: Vec<(usize, PathBuf)>,
}

pub async fn handler(files: Arc<KnownFiles>) -> Result<impl Reply, Rejection> {
    Ok(json(&AvailableResponse {
        paths: files.paths.iter().cloned().enumerate().collect(),
    }))
}

use std::path::PathBuf;

use itertools::Itertools;
use warp::{
    reject::{reject, Rejection},
    reply::{json, Reply},
};

use crate::KnownFiles;

#[derive(serde::Serialize)]
struct AvailableResponse {
    paths: Vec<(usize, PathBuf)>,
}

pub async fn handler(files: KnownFiles) -> Result<impl Reply, Rejection> {
    println!("Getting available files");

    // update the known files list
    files.generate().map_err(|_| reject())?;

    Ok(json(&AvailableResponse {
        paths: files
            .paths
            .read()
            .map_err(|_| reject())?
            .iter()
            .filter_map(|(path, (pres, id))| {
                if *pres {
                    Some((*id, path.clone()))
                } else {
                    None
                }
            })
            .sorted_by_key(|(id, _path)| *id)
            .inspect(|(id, path)| println!("  {id} -> {path:?}"))
            .collect(),
    }))
}

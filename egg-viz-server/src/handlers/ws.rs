use std::path::Path;

use futures::FutureExt;

use crate::{watcher::async_watcher, KnownFiles};
use futures::StreamExt;
use tokio::sync::mpsc;
use tokio_stream::wrappers::UnboundedReceiverStream;
use warp::{
    filters::ws::{Message, WebSocket},
    reject::{self, Rejection},
    reply::Reply,
};

pub async fn handler(
    file_id: usize,
    ws: warp::ws::Ws,
    known_files: KnownFiles,
) -> Result<impl Reply, Rejection> {
    let path = known_files
        .get_path(file_id)
        .map_err(|_| reject::not_found())?
        .clone();

    Ok(ws.on_upgrade(|x| async {
        if let Err(e) = client_connection(x, path).await {
            eprintln!("client connection error: {e:?}");
        }
    }))
}

async fn client_connection(ws: WebSocket, path: impl AsRef<Path>) -> anyhow::Result<()> {
    let (client_ws_sender, _client_ws_rcv) = ws.split();
    let (client_sender, client_rcv) = mpsc::unbounded_channel();

    let client_rcv = UnboundedReceiverStream::new(client_rcv);
    tokio::task::spawn(client_rcv.forward(client_ws_sender).map(|result| {
        if let Err(e) = result {
            eprintln!("error sending websocket msg: {}", e);
        }
    }));

    println!("connected!");

    let (mut _watcher, mut rx) = async_watcher(path)?;

    while let Some(row) = rx.next().await {
        client_sender.send(Ok(Message::text(serde_json::to_string(&row)?)))?
    }

    // while let Some(result) = client_ws_rcv.next().await {
    //     let msg = match result {
    //         Ok(msg) => msg,
    //         Err(e) => {
    //             eprintln!("error receiving ws message: {}", e);
    //             break;
    //         }
    //     };

    //     println!("{msg:?}");

    //     // client_msg(&id, msg, &clients).await;
    // }

    println!("disconnected!");

    Ok(())
}

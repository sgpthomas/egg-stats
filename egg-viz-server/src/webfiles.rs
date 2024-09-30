use std::path::Path;

use warp::Filter;

use crate::HasExtension;

const CLIENT_FILES: include_dir::Dir =
    include_dir::include_dir!("$CARGO_MANIFEST_DIR/../egg-viz-client/build");

#[derive(Clone)]
pub enum WebfileReply {
    WithHeader(&'static str, &'static str, Vec<u8>),
    Raw(Vec<u8>),
    Error,
}

impl WebfileReply {
    fn new(path: impl AsRef<Path>, content: Vec<u8>) -> Self {
        if path.as_ref().has_extension("html") {
            return WebfileReply::WithHeader("text/html", "utf-8", content);
        }

        if path.as_ref().has_extension("js") {
            return WebfileReply::WithHeader("text/javascript", "utf-8", content);
        }

        if path.as_ref().has_extension("css") {
            return WebfileReply::WithHeader("text/css", "utf-8", content);
        }

        if path.as_ref().has_extension("json") {
            return WebfileReply::WithHeader("application/json", "utf-8", content);
        }

        if path.as_ref().has_extension("svg") {
            return WebfileReply::WithHeader("image/svg+xml", "utf-8", content);
        }

        WebfileReply::Raw(content)
    }
}

impl warp::Reply for WebfileReply {
    fn into_response(self) -> warp::reply::Response {
        match self {
            WebfileReply::WithHeader(content_type, charset, data) => warp::reply::with_header(
                data,
                warp::http::header::CONTENT_TYPE,
                format!("{content_type}; charset={charset}"),
            )
            .into_response(),
            WebfileReply::Raw(s) => s.into_response(),
            WebfileReply::Error => warp::reply().into_response(),
        }
    }
}

fn build_path(path: impl AsRef<str>) -> warp::filters::BoxedFilter<()> {
    path.as_ref()
        .split('/')
        .skip_while(|p| p.is_empty())
        .fold(warp::any().boxed(), |f, path| {
            f.and(warp::path(path.to_string())).boxed()
        })
}

fn build_client_routes(
    entries: &[include_dir::DirEntry],
) -> warp::filters::BoxedFilter<(WebfileReply,)> {
    entries
        .iter()
        .map(|entry| match entry {
            include_dir::DirEntry::Dir(d) => build_client_routes(d.entries()),
            include_dir::DirEntry::File(f) => {
                // let contents = String::from_utf8(f.contents().to_vec()).unwrap_or_default();
                let reply = WebfileReply::new(f.path(), f.contents().to_vec());
                let x = build_path(f.path().to_string_lossy());
                warp::any().and(x).map(move || reply.clone()).boxed()
            }
        })
        .fold(
            warp::any()
                .and(warp::path("impossible"))
                .map(|| WebfileReply::Error)
                .boxed(),
            |routes, route| routes.or(route).unify().boxed(),
        )
}

pub fn routes() -> warp::filters::BoxedFilter<(WebfileReply,)> {
    build_client_routes(CLIENT_FILES.entries())
}

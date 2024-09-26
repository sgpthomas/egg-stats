use std::path::PathBuf;

#[derive(argh::FromArgs, Clone)]
/// visualize data generated from the egg-viz library
pub struct Args {
    /// directory to watch for changes in
    #[argh(positional)]
    pub input: PathBuf,
}

pub fn cli() -> Args {
    argh::from_env()
}

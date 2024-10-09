use std::path::PathBuf;

#[derive(argh::FromArgs, Clone)]
/// visualize data generated from the egg-viz library
pub struct Args {
    /// directory to watch for changes in
    #[argh(positional)]
    pub input: PathBuf,

    /// files to exclude
    #[argh(option, short = 'e')]
    pub exclude: Vec<String>,

    /// port to run server on
    #[argh(option, short = 'p', default = "8080")]
    pub port: u16,

    /// port that the dev server is running on
    #[argh(option, short = 'd', default = "3000")]
    pub dev_port: u16,

    /// open a browser window when the server starts
    #[argh(switch, short = 'x')]
    pub external: bool,
}

pub fn cli() -> Args {
    argh::from_env()
}

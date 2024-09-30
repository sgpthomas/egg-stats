# Egg Stats

![Crates.io Version](https://img.shields.io/crates/v/egg-stats?label=egg-stats)
![docs.rs](https://img.shields.io/docsrs/egg-stats?label=egg-stats%20docs)
![Crates.io Version](https://img.shields.io/crates/v/egg-viz?label=egg-viz)

## About

This project makes it easy to visualize statistics about your `egg` runs. There are two components: `egg-stats` and `egg-viz`.

`egg-stats` is a library that adds a `LoggingRunner` that can wrap any existing `egg::Runner` and records customizable statistics to a `csv` file.

`egg-viz` is a web interface that let's you view the generated `csv` files to quickly explore these statistics. The web interface is still in development, and any feedback would be very useful.

## Installation

You can add the `egg-stats` library to your project with:
```bash
cargo add egg-stats
```

You can install the visualizer with:
```bash
cargo install egg-viz
```

use std::{borrow::Cow, fs::OpenOptions, io::Write, marker::PhantomData, path::Path};

use crate::Recorder;

pub struct LoggingScheduler<'a, S, L, N> {
    identifier: String,
    out_file: Box<dyn Write + 'a>,
    inner_scheduler: S,
    logging: bool,
    phantom: PhantomData<(L, N)>,
    recorders: Vec<Box<dyn Recorder<L, N> + 'a>>,
}

pub fn write_headers(path: impl AsRef<Path>) {
    OpenOptions::new()
        .truncate(true)
        .write(true)
        .create(true)
        .open(path)
        .unwrap();

    // let headers: [&str; 6] = ["id", "iteration", "rule", "when", "name", "value"];
    // writeln!(file, "{}", headers.join(",")).unwrap();
}

impl<'a, S, L, N> LoggingScheduler<'a, S, L, N> {
    pub fn new(scheduler: S) -> Self {
        LoggingScheduler {
            identifier: "default".to_string(),
            out_file: Box::new(std::io::stdout()),
            inner_scheduler: scheduler,
            logging: false,
            phantom: PhantomData,
            recorders: vec![],
        }
    }

    pub fn with_identifier(mut self, id: impl ToString) -> Self {
        self.identifier = id.to_string();
        self
    }

    pub fn with_out_file<W: Write + 'a>(mut self, out_file: W) -> Self {
        self.out_file = Box::new(out_file);
        self
    }

    pub fn with_logging_enabled(mut self, enabled: bool) -> Self {
        self.logging = enabled;
        self
    }

    pub fn with_recorder<D: Recorder<L, N> + 'a>(mut self, datum: D) -> Self
    where
        L: egg::Language,
        N: egg::Analysis<L>,
    {
        self.recorders.push(Box::new(datum));
        self
    }

    pub fn identifier(&mut self, id: impl ToString) -> &mut Self {
        self.identifier = id.to_string();
        self
    }

    pub fn out_file(&mut self, out_file: impl Write + 'a) -> &mut Self {
        self.out_file = Box::new(out_file);
        self
    }

    pub fn logging_enabled(&mut self, enabled: bool) -> &mut Self {
        self.logging = enabled;
        self
    }

    pub fn record<D: Recorder<L, N> + 'a>(&mut self, datum: D) -> &mut Self
    where
        L: egg::Language,
        N: egg::Analysis<L>,
    {
        self.recorders.push(Box::new(datum));
        self
    }

    fn write(
        &mut self,
        iteration: usize,
        rule_name: &str,
        typ: &str,
        id: Cow<'static, str>,
        datum: String,
    ) {
        writeln!(
            &mut self.out_file,
            "{},{},{},{},{},{}",
            self.identifier, iteration, rule_name, typ, id, datum
        )
        .unwrap();
    }
}

impl<'a, S, L, N> From<S> for LoggingScheduler<'a, S, L, N>
where
    S: egg::RewriteScheduler<L, N>,
    L: egg::Language,
    N: egg::Analysis<L>,
{
    fn from(value: S) -> Self {
        LoggingScheduler::new(value)
    }
}

impl<'a, S, L, N> egg::RewriteScheduler<L, N> for LoggingScheduler<'a, S, L, N>
where
    S: egg::RewriteScheduler<L, N>,
    L: egg::Language,
    N: egg::Analysis<L>,
{
    fn can_stop(&mut self, iteration: usize) -> bool {
        // if disabled, just call underlying scheduler
        if !self.logging {
            return self.inner_scheduler.can_stop(iteration);
        }

        self.inner_scheduler.can_stop(iteration)
    }

    fn search_rewrite<'s>(
        &mut self,
        iteration: usize,
        egraph: &egg::EGraph<L, N>,
        rewrite: &'s egg::Rewrite<L, N>,
    ) -> Vec<egg::SearchMatches<'s, L>> {
        // if disabled, just call underlying scheduler
        if !self.logging {
            return self
                .inner_scheduler
                .search_rewrite(iteration, egraph, rewrite);
        }

        self.recorders
            .iter()
            .map(|recorder| {
                (
                    recorder.identifier(),
                    recorder.record_before_search(iteration, egraph, rewrite),
                )
            })
            .collect::<Vec<_>>()
            .into_iter()
            .for_each(|(id, datum)| {
                if let Some(datum) = datum {
                    self.write(iteration, rewrite.name.as_str(), "before_search", id, datum);
                }
            });

        let matches = self
            .inner_scheduler
            .search_rewrite(iteration, egraph, rewrite);

        self.recorders
            .iter()
            .map(|recorder| {
                (
                    recorder.identifier(),
                    recorder.record_after_search(iteration, egraph, rewrite, &matches),
                )
            })
            .collect::<Vec<_>>()
            .into_iter()
            .for_each(|(id, datum)| {
                if let Some(datum) = datum {
                    self.write(iteration, rewrite.name.as_str(), "before_search", id, datum);
                }
            });

        matches
    }

    fn apply_rewrite(
        &mut self,
        iteration: usize,
        egraph: &mut egg::EGraph<L, N>,
        rewrite: &egg::Rewrite<L, N>,
        matches: Vec<egg::SearchMatches<L>>,
    ) -> usize {
        // if disabled, just call underlying scheduler
        if !self.logging {
            return self
                .inner_scheduler
                .apply_rewrite(iteration, egraph, rewrite, matches);
        }

        self.recorders
            .iter()
            .map(|recorder| {
                (
                    recorder.identifier(),
                    recorder.record_before_rewrite(iteration, egraph, rewrite, &matches),
                )
            })
            .collect::<Vec<_>>()
            .into_iter()
            .for_each(|(id, datum)| {
                if let Some(datum) = datum {
                    self.write(
                        iteration,
                        rewrite.name.as_str(),
                        "before_rewrite",
                        id,
                        datum,
                    );
                }
            });

        let n_matches = self
            .inner_scheduler
            .apply_rewrite(iteration, egraph, rewrite, matches);

        self.recorders
            .iter()
            .map(|recorder| {
                (
                    recorder.identifier(),
                    recorder.record_after_rewrite(iteration, egraph, rewrite, n_matches),
                )
            })
            .collect::<Vec<_>>()
            .into_iter()
            .for_each(|(id, datum)| {
                if let Some(datum) = datum {
                    self.write(iteration, rewrite.name.as_str(), "after_rewrite", id, datum);
                }
            });

        n_matches
    }
}

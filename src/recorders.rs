use std::{borrow::Cow, time::Instant};

use crate::{impl_recorder, AfterRewriteArgs, BeforeRewriteArgs, Recorder};

pub struct Timestamp {
    start: Instant,
}

impl Default for Timestamp {
    fn default() -> Self {
        Timestamp {
            start: Instant::now(),
        }
    }
}

impl Timestamp {
    pub fn new(start: Instant) -> Self {
        Timestamp { start }
    }
}

impl_recorder! {
    Timestamp;
    identifier => "time",
    before_rewrite => |ts: &Self, _| {
        let passed = ts.start.elapsed();
        Some(format!("{}", passed.as_millis()))
    }
}

impl_recorder! {
    pub struct NumberENodes;
    identifier => "enodes",
    before_rewrite => |_, x: BeforeRewriteArgs<_, _>| {
        Some(format!("{}", x.egraph.total_size()))
    },
    after_rewrite => |_, x: AfterRewriteArgs<_, _>| {
        Some(format!("{}", x.egraph.total_size()))
    }
}

impl_recorder! {
    pub struct NumberEClasses;
    identifier => "eclasses",
    before_rewrite => |_, x: BeforeRewriteArgs<_, _>| {
        Some(format!("{}", x.egraph.number_of_classes()))
    }
}

pub struct BestProgram<C> {
    cost_fn: C,
    root: egg::Id,
    rebuild: bool,
}

impl<C> BestProgram<C> {
    pub fn new(cost_fn: C, root: egg::Id) -> Self {
        BestProgram {
            cost_fn,
            root,
            rebuild: false,
        }
    }

    pub fn with_rebuild(mut self, rebuild: bool) -> Self {
        self.rebuild = rebuild;
        self
    }
}

/// Custom clone trait so that
pub trait Replicate {
    fn replicate(&self) -> Self;
}

impl Replicate for egg::AstSize {
    fn replicate(&self) -> Self {
        egg::AstSize
    }
}

impl<L, N, C> Recorder<L, N> for BestProgram<C>
where
    L: egg::Language,
    N: egg::Analysis<L>,
    C: egg::CostFunction<L> + Replicate,
    <C as egg::CostFunction<L>>::Cost: std::fmt::Display,
{
    fn identifier(&self) -> Cow<'static, str> {
        "cost".into()
    }

    fn record_before_rewrite(
        &self,
        _iteration: usize,
        egraph: &mut egg::EGraph<L, N>,
        _rewrite: &egg::Rewrite<L, N>,
        _matches: &[egg::SearchMatches<L>],
    ) -> Option<String> {
        let extractor = egg::Extractor::new(egraph, self.cost_fn.replicate());
        Some(format!("{}", extractor.find_best_cost(self.root)))
    }

    fn record_after_rewrite(
        &self,
        _iteration: usize,
        egraph: &mut egg::EGraph<L, N>,
        _rewrite: &egg::Rewrite<L, N>,
        _n_matches: usize,
    ) -> Option<String> {
        if self.rebuild {
            egraph.rebuild();
            let extractor = egg::Extractor::new(egraph, self.cost_fn.replicate());
            Some(format!("{}", extractor.find_best_cost(self.root)))
        } else {
            None
        }
    }
}

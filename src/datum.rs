use std::borrow::Cow;

pub trait Recorder<L, N>
where
    L: egg::Language,
    N: egg::Analysis<L>,
{
    fn identifier(&self) -> Cow<'static, str>;

    #[allow(unused_variables)]
    fn record_before_search<'r>(
        &self,
        iteration: usize,
        egraph: &'r egg::EGraph<L, N>,
        rewrite: &'r egg::Rewrite<L, N>,
    ) -> Option<String> {
        None
    }

    #[allow(unused_variables)]
    fn record_after_search<'r>(
        &self,
        iteration: usize,
        egraph: &'r egg::EGraph<L, N>,
        rewrite: &'r egg::Rewrite<L, N>,
        matches: &[egg::SearchMatches<L>],
    ) -> Option<String> {
        None
    }

    #[allow(unused_variables)]
    fn record_before_rewrite(
        &self,
        iteration: usize,
        egraph: &mut egg::EGraph<L, N>,
        rewrite: &egg::Rewrite<L, N>,
        matches: &[egg::SearchMatches<L>],
    ) -> Option<String> {
        None
    }

    #[allow(unused_variables)]
    fn record_after_rewrite(
        &self,
        iteration: usize,
        egraph: &mut egg::EGraph<L, N>,
        rewrite: &egg::Rewrite<L, N>,
        n_matches: usize,
    ) -> Option<String> {
        None
    }
}

pub struct BeforeSearchArgs<'a, L, N>
where
    L: egg::Language,
    N: egg::Analysis<L>,
{
    pub iteration: usize,
    pub egraph: &'a egg::EGraph<L, N>,
    pub rewrite: &'a egg::Rewrite<L, N>,
}

pub struct AfterSearchArgs<'a, L, N>
where
    L: egg::Language,
    N: egg::Analysis<L>,
{
    pub iteration: usize,
    pub egraph: &'a egg::EGraph<L, N>,
    pub rewrite: &'a egg::Rewrite<L, N>,
    pub matches: &'a [egg::SearchMatches<'a, L>],
}

pub struct BeforeRewriteArgs<'a, L, N>
where
    L: egg::Language,
    N: egg::Analysis<L>,
{
    pub iteration: usize,
    pub egraph: &'a mut egg::EGraph<L, N>,
    pub rewrite: &'a egg::Rewrite<L, N>,
    pub matches: &'a [egg::SearchMatches<'a, L>],
}

pub struct AfterRewriteArgs<'a, L, N>
where
    L: egg::Language,
    N: egg::Analysis<L>,
{
    pub iteration: usize,
    pub egraph: &'a mut egg::EGraph<L, N>,
    pub rewrite: &'a egg::Rewrite<L, N>,
    pub n_matches: usize,
}

#[macro_export]
macro_rules! impl_recorder {
    ($type_name:ident; $($name:ident => $val:expr),*) => {
        impl<L, N> Recorder<L, N> for $type_name
        where
            L: egg::Language,
            N: egg::Analysis<L>,
        {
            $(impl_recorder!(impl $name, $val);)*
        }
    };

    ($vis:vis struct $type_name:ident; $($name:ident => $val:expr),*) => {
        $vis struct $type_name;
        impl_recorder!($type_name; $($name => $val),*);
    };

    (impl identifier, $name:literal) => {
        fn identifier(&self) -> Cow<'static, str> {
            $name.into()
        }
    };

    (impl before_search, $br:expr) => {
        fn record_before_search<'r>(
            &self,
            iteration: usize,
            egraph: &'r egg::EGraph<L, N>,
            rewrite: &'r egg::Rewrite<L, N>,
        ) -> Option<String> {
            $br(self, $crate::BeforeSearchArgs {
                iteration,
                egraph,
                rewrite,
            })
        }
    };

    (impl after_search, $br:expr) => {
        fn record_after_search<'r>(
            &self,
            iteration: usize,
            egraph: &'r egg::EGraph<L, N>,
            rewrite: &'r egg::Rewrite<L, N>,
            matches: &[egg::SearchMatches<L>],
        ) -> Option<String> {
            $br(self, $crate::AfterSearchArgs {
                iteration,
                egraph,
                rewrite,
                matches,
            })
        }
    };

    (impl before_rewrite, $br:expr) => {
        fn record_before_rewrite(
            &self,
            iteration: usize,
            egraph: &mut egg::EGraph<L, N>,
            rewrite: &egg::Rewrite<L, N>,
            matches: &[egg::SearchMatches<L>],
        ) -> Option<String> {
            $br(self, $crate::BeforeRewriteArgs {
                iteration,
                egraph,
                rewrite,
                matches,
            })
        }
    };

    (impl after_rewrite, $br:expr) => {
        fn record_after_rewrite(
            &self,
            iteration: usize,
            egraph: &mut egg::EGraph<L, N>,
            rewrite: &egg::Rewrite<L, N>,
            n_matches: usize,
        ) -> Option<String> {
            $br(self, $crate::AfterRewriteArgs {
                iteration,
                egraph,
                rewrite,
                n_matches,
            })
        }
    };
}

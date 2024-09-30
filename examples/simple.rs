use egg::*;
use egg_stats::{recorders, LoggingScheduler};
use std::path::Path;
use std::{fs::OpenOptions, time::Instant};

define_language! {
    enum SimpleLanguage {
        Num(i32),
        "+" = Add([Id; 2]),
        "*" = Mul([Id; 2]),
        "/" = Div([Id; 2]),
        "<<" = Lsh([Id; 2]),
        Symbol(Symbol),
    }
}

fn make_rules() -> Vec<Rewrite<SimpleLanguage, ()>> {
    vec![
        rewrite!("commute-add"; "(+ ?a ?b)" => "(+ ?b ?a)"),
        rewrite!("assoc-add"; "(+ ?a (+ ?b ?c))" => "(+ (+ ?a ?b) ?c)"),
        rewrite!("commute-mul"; "(* ?a ?b)" => "(* ?b ?a)"),
        rewrite!("assoc-mul"; "(* ?a (* ?b ?c))" => "(* (* ?a ?b) ?c)"),
        rewrite!("add-0"; "(+ ?a 0)" => "?a"),
        rewrite!("mul-0"; "(* ?a 0)" => "0"),
        rewrite!("mul-1"; "(* ?a 1)" => "?a"),
        rewrite!("lsh"; "(/ ?a 2)" => "(<< ?a 1)"),
        rewrite!("lsh-rev"; "(<< ?a 1)" => "(/ ?a 2)"),
        rewrite!("div-same"; "(/ ?a ?a)" => "1"),
        rewrite!("div-mul-distr"; "(/ (* ?a ?b) ?c)" => "(* ?a (/ ?b ?c))"),
        rewrite!("div-mul-distr-rev"; "(* ?a (/ ?b ?c))" => "(/ (* ?a ?b) ?c)"),
    ]
}

/// parse an expression, simplify it using egg, and pretty print it back out
fn simplify_with(
    s: &str,
    scheduler: impl RewriteScheduler<SimpleLanguage, ()> + 'static,
    path: impl AsRef<Path>,
) {
    // parse the expression, the type annotation tells it which Language to use
    let expr: RecExpr<SimpleLanguage> = s.parse().unwrap();

    let mut egraph = EGraph::new(());
    let root = egraph.add_expr(&expr);

    // simplify the expression using a Runner, which creates an e-graph with
    // the given expression and runs the given rules over it
    Runner::default()
        .with_scheduler(
            LoggingScheduler::from(scheduler)
                .with_out_file(
                    OpenOptions::new()
                        .write(true)
                        .create(true)
                        .truncate(true)
                        .open(path.as_ref())
                        .unwrap(),
                )
                .with_logging_enabled(true)
                .with_recorder(recorders::Timestamp::new(Instant::now()))
                .with_recorder(recorders::NumberENodes)
                .with_recorder(recorders::NumberEClasses)
                .with_recorder(recorders::BestProgram::new(AstSize, root)),
        )
        .with_egraph(egraph)
        .run(&make_rules());

    println!("Wrote {:?}", path.as_ref());
}

fn main() {
    let expr = "(/ (* 1 (* 2 ?a)) 2)";
    simplify_with(expr, BackoffScheduler::default(), "backoff.csv");

    simplify_with(expr, SimpleScheduler, "simple.csv");
}

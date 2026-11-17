//// [tests/cases/conformance/lint/rules/one-var/lintOneVarRolloutStyleFixturesCase2.ts] ////

//// [input.ts]

declare function acquire(): Disposable & AsyncDisposable;

async function example() {
    var first,
     second;
    let third = 1; let fourth = 2;
    const fifth = 5,
     sixth = 6;
    using seventh = acquire(); using eighth = acquire();
    await using ninth = acquire(),
      tenth = acquire();
}

//// [input.ts]

declare function acquire(): Disposable & AsyncDisposable;

async function example() {
    var first,
     second;
    let third = 1; let fourth = 2;
    const fifth = 5,
     sixth = 6;
    using seventh = acquire(); using eighth = acquire();
    await using ninth = acquire(),
      tenth = acquire();
}

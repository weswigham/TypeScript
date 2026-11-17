//// [tests/cases/conformance/lint/rules/no-self-assign/lintNoSelfAssignCoreCABABABCDABCD.ts] ////

//// [input.ts]
[a, ...b] = [a, ...b]; ({a: {b}, c: [d]} = {a: {b}, c: [d]});

//// [input.ts]
[a, ...b] = [a, ...b]; ({a: {b}, c: [d]} = {a: {b}, c: [d]});

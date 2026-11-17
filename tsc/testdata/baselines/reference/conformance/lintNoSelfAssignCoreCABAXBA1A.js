//// [tests/cases/conformance/lint/rules/no-self-assign/lintNoSelfAssignCoreCABAXBA1A.ts] ////

//// [input.ts]
({a, b} = {a, ...x, b}); [a = 1] = [a];

//// [input.ts]
({a, b} = {a, ...x, b}); [a = 1] = [a];

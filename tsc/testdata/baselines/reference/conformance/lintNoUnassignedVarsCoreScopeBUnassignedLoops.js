//// [tests/cases/conformance/lint/rules/no-unassigned-vars/lintNoUnassignedVarsCoreScopeBUnassignedLoops.ts] ////

//// [input.ts]
let read; for (read of values) use(read); let update; update++; let shorthand; const object = {shorthand};

//// [input.ts]
let read; for (read of values) use(read); let update; update++; let shorthand; const object = {shorthand};

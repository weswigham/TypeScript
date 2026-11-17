//// [tests/cases/conformance/lint/rules/no-undef-init/lintNoUndefInitCoreScopeCReportsFunctionLocalUndefinedLetValueUndefinedLetXUndefined.ts] ////

//// [input.ts]
function local(undefined) { let value = undefined; } let { x } = undefined;

//// [input.ts]
function local(undefined) { let value = undefined; } let { x } = undefined;

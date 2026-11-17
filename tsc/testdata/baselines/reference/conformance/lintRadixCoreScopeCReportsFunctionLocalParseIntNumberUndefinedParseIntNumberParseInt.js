//// [tests/cases/conformance/lint/rules/radix/lintRadixCoreScopeCReportsFunctionLocalParseIntNumberUndefinedParseIntNumberParseInt.ts] ////

//// [input.ts]
function local(parseInt, Number, undefined) { parseInt(); Number.parseInt(); }

//// [input.ts]
function local(parseInt, Number, undefined) { parseInt(); Number.parseInt(); }

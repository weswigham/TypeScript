//// [tests/cases/conformance/lint/rules/object-shorthand/lintObjectShorthandRolloutDeclarationsShorthandGenericArrow.ts] ////

//// [input.ts]
const o = {f: <T>(x: T): T => { return x; }};

//// [input.ts]
const o = {f<T>(x: T): T { return x; }};

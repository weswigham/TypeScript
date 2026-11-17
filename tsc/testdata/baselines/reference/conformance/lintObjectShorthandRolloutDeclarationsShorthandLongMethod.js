//// [tests/cases/conformance/lint/rules/object-shorthand/lintObjectShorthandRolloutDeclarationsShorthandLongMethod.ts] ////

//// [input.ts]
const o = {async *f() {}};

//// [input.ts]
const o = {f: async function*() {}};

//// [tests/cases/conformance/lint/rules/id-denylist/lintIdDenylistRolloutBindingsRulesDenyGlobals.ts] ////

//// [input.ts]
const value = undefined; const object = {undefined}; Object.keys(value);

//// [input.ts]
const value = undefined; const object = {undefined}; Object.keys(value);

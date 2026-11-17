//// [tests/cases/conformance/lint/rules/id-denylist/lintIdDenylistRolloutBindingsRulesDenyDestructuring.ts] ////

//// [input.ts]
const {bad: good, other: bad, nested: {bad: fine}} = source;

//// [input.ts]
const {bad: good, other: bad, nested: {bad: fine}} = source;

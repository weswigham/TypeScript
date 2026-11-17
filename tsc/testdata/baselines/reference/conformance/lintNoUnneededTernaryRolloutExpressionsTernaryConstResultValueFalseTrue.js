//// [tests/cases/conformance/lint/rules/no-unneeded-ternary/lintNoUnneededTernaryRolloutExpressionsTernaryConstResultValueFalseTrue.ts] ////

//// [input.ts]
const result = value ? false : true;

//// [input.ts]
const result = !value;

//// [tests/cases/conformance/lint/rules/no-unneeded-ternary/lintNoUnneededTernaryRolloutExpressionsTernaryConstResultValueTrueFalse.ts] ////

//// [input.ts]
const result = value ? true : false;

//// [input.ts]
const result = !!value;

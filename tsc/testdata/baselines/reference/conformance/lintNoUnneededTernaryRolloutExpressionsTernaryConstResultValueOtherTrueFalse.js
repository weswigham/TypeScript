//// [tests/cases/conformance/lint/rules/no-unneeded-ternary/lintNoUnneededTernaryRolloutExpressionsTernaryConstResultValueOtherTrueFalse.ts] ////

//// [input.ts]
const result = value < other ? true : false;

//// [input.ts]
const result = value < other;

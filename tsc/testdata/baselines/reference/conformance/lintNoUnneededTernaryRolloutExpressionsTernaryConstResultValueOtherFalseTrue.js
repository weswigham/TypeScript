//// [tests/cases/conformance/lint/rules/no-unneeded-ternary/lintNoUnneededTernaryRolloutExpressionsTernaryConstResultValueOtherFalseTrue.ts] ////

//// [input.ts]
const result = value === other ? false : true;

//// [input.ts]
const result = value !== other;

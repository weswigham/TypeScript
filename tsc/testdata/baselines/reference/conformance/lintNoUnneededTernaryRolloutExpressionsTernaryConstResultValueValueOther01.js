//// [tests/cases/conformance/lint/rules/no-unneeded-ternary/lintNoUnneededTernaryRolloutExpressionsTernaryConstResultValueValueOther01.ts] ////

//// [input.ts]
const result = value ? value : other;

//// [input.ts]
const result = value || other;

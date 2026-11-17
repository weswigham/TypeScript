//// [tests/cases/conformance/lint/rules/prefer-template/lintPreferTemplateRolloutExpressionsTemplateConstTextABValue.ts] ////

//// [input.ts]
const text = 'a' + 'b' + value;

//// [input.ts]
const text = `a` + `b${value}`;

//// [tests/cases/conformance/lint/rules/prefer-template/lintPreferTemplateRolloutExpressionsTemplateConstTextAKeepValue.ts] ////

//// [input.ts]
const text = 'a' /* keep */ + value;

//// [input.ts]
const text = `a${value}` /* keep */;

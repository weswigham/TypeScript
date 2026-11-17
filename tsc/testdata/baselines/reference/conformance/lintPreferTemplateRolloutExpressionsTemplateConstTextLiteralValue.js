//// [tests/cases/conformance/lint/rules/prefer-template/lintPreferTemplateRolloutExpressionsTemplateConstTextLiteralValue.ts] ////

//// [input.ts]
const text = '${literal}`' + value;

//// [input.ts]
const text = `\${literal}\`${value}`;

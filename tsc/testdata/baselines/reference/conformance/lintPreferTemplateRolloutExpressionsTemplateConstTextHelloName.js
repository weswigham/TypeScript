//// [tests/cases/conformance/lint/rules/prefer-template/lintPreferTemplateRolloutExpressionsTemplateConstTextHelloName.ts] ////

//// [input.ts]
const text = 'hello ' + name + '!';

//// [input.ts]
const text = `hello ${name}!`;

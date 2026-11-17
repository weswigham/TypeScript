//// [tests/cases/conformance/lint/rules/prefer-template/lintPreferTemplateRolloutExpressionsTemplateWorkHelloName.ts] ////

//// [input.ts]
work()
'hello ' + name;

//// [input.ts]
work();
`hello ${name}`;

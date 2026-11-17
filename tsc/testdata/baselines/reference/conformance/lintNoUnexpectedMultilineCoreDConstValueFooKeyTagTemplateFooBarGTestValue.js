//// [tests/cases/conformance/lint/rules/no-unexpected-multiline/lintNoUnexpectedMultilineCoreDConstValueFooKeyTagTemplateFooBarGTestValue.ts] ////

//// [input.ts]
const value = foo
[key]; tag
`template`; foo
 /bar/g.test(value);

//// [input.ts]
const value = foo
[key]; tag
`template`; foo
 /bar/g.test(value);

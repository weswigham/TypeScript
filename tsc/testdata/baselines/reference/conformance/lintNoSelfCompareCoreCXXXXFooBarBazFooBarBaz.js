//// [tests/cases/conformance/lint/rules/no-self-compare/lintNoSelfCompareCoreCXXXXFooBarBazFooBarBaz.ts] ////

//// [input.ts]
x === x; x <= x; foo.bar().baz >= foo.bar ().baz;

//// [input.ts]
x === x; x <= x; foo.bar().baz >= foo.bar ().baz;

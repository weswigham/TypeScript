//// [tests/cases/conformance/lint/rules/no-unexpected-multiline/noUnexpectedMultilineCore.ts] ////

//// [input.ts]
const value = (foo || bar)
(value).method();
const property = foo
[key];
tag
`template`;
foo
/bar/g.test(value);
foo
();
foo
?.(value);
foo?.
[key];
foo /bar/g;

//// [input.ts]
const value = (foo || bar)
(value).method();
const property = foo
[key];
tag
`template`;
foo
/bar/g.test(value);
foo
();
foo
?.(value);
foo?.
[key];
foo /bar/g;

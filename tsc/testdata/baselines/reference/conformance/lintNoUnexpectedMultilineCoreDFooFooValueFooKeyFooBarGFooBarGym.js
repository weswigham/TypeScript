//// [tests/cases/conformance/lint/rules/no-unexpected-multiline/lintNoUnexpectedMultilineCoreDFooFooValueFooKeyFooBarGFooBarGym.ts] ////

//// [input.ts]
foo
(); foo
?.(value); foo?.
[key]; foo /bar/g; foo
/bar/ gym;

//// [input.ts]
foo
(); foo
?.(value); foo?.
[key]; foo /bar/g; foo
/bar/ gym;

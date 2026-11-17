//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericComments.ts] ////

//// [input.ts]
const value: /* first */ Box /* second */ < /* third */ string> = new Box ();

//// [input.ts]
const value = new Box/* first *//* second */< /* third */ string> ();

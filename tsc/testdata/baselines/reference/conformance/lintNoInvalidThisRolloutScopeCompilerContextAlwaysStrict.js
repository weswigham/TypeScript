//// [tests/cases/conformance/lint/rules/no-invalid-this/lintNoInvalidThisRolloutScopeCompilerContextAlwaysStrict.ts] ////

//// [globals.d.ts]
interface Object {}
interface Function {}
interface Array<T> {}

//// [input.ts]
this; function f() { this; }

//// [input.ts]
this; function f() { this; }

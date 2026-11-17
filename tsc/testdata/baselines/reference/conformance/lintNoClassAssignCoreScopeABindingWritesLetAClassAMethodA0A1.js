//// [tests/cases/conformance/lint/rules/no-class-assign/lintNoClassAssignCoreScopeABindingWritesLetAClassAMethodA0A1.ts] ////

//// [input.ts]
let A = class A { method() { A = 0; } }; A = 1;

//// [input.ts]
let A = class A { method() { A = 0; } }; A = 1;

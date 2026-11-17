//// [tests/cases/conformance/lint/rules/no-class-assign/lintNoClassAssignCoreScopeABindingWritesClassAMethodAA1OtherLetAA.ts] ////

//// [input.ts]
class A { method(A) { A = 1; } other() { let A; A++; } }

//// [input.ts]
class A { method(A) { A = 1; } other() { let A; A++; } }

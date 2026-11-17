//// [tests/cases/conformance/lint/rules/no-class-assign/lintNoClassAssignCoreScopeABindingWritesA1ClassAForAOfValues.ts] ////

//// [input.ts]
A = 1; class A {} for (A of values) {}

//// [input.ts]
A = 1; class A {} for (A of values) {}

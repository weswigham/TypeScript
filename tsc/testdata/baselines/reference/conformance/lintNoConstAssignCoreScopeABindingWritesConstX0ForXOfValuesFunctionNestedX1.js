//// [tests/cases/conformance/lint/rules/no-const-assign/lintNoConstAssignCoreScopeABindingWritesConstX0ForXOfValuesFunctionNestedX1.ts] ////

//// [input.ts]
const x = 0; for (x of values) {} function nested() { x = 1; }

//// [input.ts]
const x = 0; for (x of values) {} function nested() { x = 1; }

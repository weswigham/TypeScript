//// [tests/cases/conformance/lint/rules/no-const-assign/lintNoConstAssignCoreScopeABindingWritesConstX0XXX1X1.ts] ////

//// [input.ts]
const x = 0; x++; ++x; x += 1; x ||= 1;

//// [input.ts]
const x = 0; x++; ++x; x += 1; x ||= 1;

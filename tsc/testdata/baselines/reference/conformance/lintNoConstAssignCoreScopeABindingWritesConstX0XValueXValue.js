//// [tests/cases/conformance/lint/rules/no-const-assign/lintNoConstAssignCoreScopeABindingWritesConstX0XValueXValue.ts] ////

//// [input.ts]
const x = 0; ({ ...x } = value); [...x] = value;

//// [input.ts]
const x = 0; ({ ...x } = value); [...x] = value;

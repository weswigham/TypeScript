//// [tests/cases/conformance/lint/rules/no-const-assign/lintNoConstAssignCoreScopeABindingWritesUsingXResourceX1AwaitUsingYResourceYValue.ts] ////

//// [input.ts]
using x = resource(); x = 1; await using y = resource(); y ??= value;

//// [input.ts]
using x = resource(); x = 1; await using y = resource(); y ??= value;

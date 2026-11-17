//// [tests/cases/conformance/lint/rules/no-const-assign/lintNoConstAssignCoreScopeABindingWritesConstX0XYValueObjX1XKey1FunctionNestedXX1.ts] ////

//// [input.ts]
const x = 0; ({ [x]: y } = value); obj.x = 1; x.key = 1; function nested(x) { x = 1; }

//// [input.ts]
const x = 0; ({ [x]: y } = value); obj.x = 1; x.key = 1; function nested(x) { x = 1; }

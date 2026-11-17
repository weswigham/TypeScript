//// [tests/cases/conformance/lint/rules/no-const-assign/lintNoConstAssignCoreScopeABindingWritesConstKeyXValueXValueXValueKeyX1Value.ts] ////

//// [input.ts]
const { key: x } = value; [x] = value; ({ x } = value); ({ key: x = 1 } = value);

//// [input.ts]
const { key: x } = value; [x] = value; ({ x } = value); ({ key: x = 1 } = value);

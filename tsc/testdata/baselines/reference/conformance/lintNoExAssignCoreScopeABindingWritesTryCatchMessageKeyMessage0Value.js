//// [tests/cases/conformance/lint/rules/no-ex-assign/lintNoExAssignCoreScopeABindingWritesTryCatchMessageKeyMessage0Value.ts] ////

//// [input.ts]
try {} catch ({ message }) { ({ key: message = 0 } = value); }

//// [input.ts]
try {} catch ({ message }) { ({ key: message = 0 } = value); }

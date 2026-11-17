//// [tests/cases/conformance/lint/rules/no-ex-assign/lintNoExAssignCoreScopeABindingWritesTryCatchErrorFunctionNestedError0.ts] ////

//// [input.ts]
try {} catch (error) { function nested() { error = 0; } }

//// [input.ts]
try {} catch (error) { function nested() { error = 0; } }

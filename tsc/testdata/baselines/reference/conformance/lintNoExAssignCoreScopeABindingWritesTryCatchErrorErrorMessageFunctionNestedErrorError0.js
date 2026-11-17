//// [tests/cases/conformance/lint/rules/no-ex-assign/lintNoExAssignCoreScopeABindingWritesTryCatchErrorErrorMessageFunctionNestedErrorError0.ts] ////

//// [input.ts]
try {} catch (error) { error.message = ''; function nested(error) { error = 0; } }

//// [input.ts]
try {} catch (error) { error.message = ''; function nested(error) { error = 0; } }

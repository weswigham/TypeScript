//// [tests/cases/conformance/lint/rules/no-ex-assign/lintNoExAssignCoreScopeABindingWritesTryCatchErrorError1ErrorErrorValues.ts] ////

//// [input.ts]
try {} catch (error) { error = 1; error++; [error] = values; }

//// [input.ts]
try {} catch (error) { error = 1; error++; [error] = values; }

//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreScopeCReportsTryCatchErrorFunctionFThrowNewErrorThrowNewErrorOptions.ts] ////

//// [input.ts]
try {} catch (error) { function f() { throw new Error(); } throw new Error('', options); }

//// [input.ts]
try {} catch (error) { function f() { throw new Error(); } throw new Error('', options); }

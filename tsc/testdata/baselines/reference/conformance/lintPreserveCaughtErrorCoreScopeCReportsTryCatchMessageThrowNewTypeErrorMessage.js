//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreScopeCReportsTryCatchMessageThrowNewTypeErrorMessage.ts] ////

//// [input.ts]
try {} catch ({ message }) { throw new TypeError(message); }

//// [input.ts]
try {} catch ({ message }) { throw new TypeError(message); }

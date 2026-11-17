//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreScopeCReportsTryCatchErrorLetErrorThrowNewErrorCauseError.ts] ////

//// [input.ts]
try {} catch (error) { { let error; throw new Error('', { cause: error }); } }

//// [input.ts]
try {} catch (error) { { let error; throw new Error('', { cause: error }); } }

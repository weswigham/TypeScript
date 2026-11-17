//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreScopeCReportsTryCatchErrorThrowNewErrorFailedCauseError.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error('failed', { cause: error }); }

//// [input.ts]
try {} catch (error) { throw new Error('failed', { cause: error }); }

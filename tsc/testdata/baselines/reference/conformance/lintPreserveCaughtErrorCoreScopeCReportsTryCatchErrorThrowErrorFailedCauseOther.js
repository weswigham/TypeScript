//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreScopeCReportsTryCatchErrorThrowErrorFailedCauseOther.ts] ////

//// [input.ts]
try {} catch (error) { throw Error('failed', { cause: other }); }

//// [input.ts]
try {} catch (error) { throw Error('failed', { cause: other }); }

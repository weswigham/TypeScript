//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreScopeCReportsTryCatchErrorThrowNewErrorFailed.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error('failed'); }

//// [input.ts]
try {} catch (error) { throw new Error('failed'); }

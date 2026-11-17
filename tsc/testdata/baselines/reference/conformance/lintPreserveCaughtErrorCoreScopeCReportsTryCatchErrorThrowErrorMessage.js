//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreScopeCReportsTryCatchErrorThrowErrorMessage.ts] ////

//// [input.ts]
try {} catch (error) { throw Error?.('message'); }

//// [input.ts]
try {} catch (error) { throw Error?.('message'); }

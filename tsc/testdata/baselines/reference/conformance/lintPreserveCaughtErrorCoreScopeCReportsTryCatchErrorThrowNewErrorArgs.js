//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreScopeCReportsTryCatchErrorThrowNewErrorArgs.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error(...args); }

//// [input.ts]
try {} catch (error) { throw new Error(...args); }

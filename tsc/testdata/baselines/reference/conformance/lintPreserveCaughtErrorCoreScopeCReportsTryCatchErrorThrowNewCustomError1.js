//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreScopeCReportsTryCatchErrorThrowNewCustomError1.ts] ////

//// [input.ts]
try {} catch (error) { throw new CustomError(1); }

//// [input.ts]
try {} catch (error) { throw new CustomError(1); }

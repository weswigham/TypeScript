//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreScopeCReportsTryCatchErrorThrowNewAggregateErrorCauseError.ts] ////

//// [input.ts]
try {} catch (error) { throw new AggregateError([], '', { cause: error }); }

//// [input.ts]
try {} catch (error) { throw new AggregateError([], '', { cause: error }); }

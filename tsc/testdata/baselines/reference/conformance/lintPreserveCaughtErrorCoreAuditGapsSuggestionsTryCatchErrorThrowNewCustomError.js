//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewCustomError.ts] ////

//// [input.ts]
try {} catch (error) { throw new CustomError(); }

//// [input.ts]
try {} catch (error) { throw new CustomError(); }

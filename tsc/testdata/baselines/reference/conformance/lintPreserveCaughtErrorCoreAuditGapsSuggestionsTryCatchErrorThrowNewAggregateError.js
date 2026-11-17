//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewAggregateError.ts] ////

//// [input.ts]
try {} catch (error) { throw new AggregateError(); }

//// [input.ts]
try {} catch (error) { throw new AggregateError(); }

//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewErrorGetCauseReturnOther.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error('', {get cause() { return other; }}); }

//// [input.ts]
try {} catch (error) { throw new Error('', {get cause() { return other; }}); }

//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewErrorCauseReturnOther.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error('', {cause() { return other; }}); }

//// [input.ts]
try {} catch (error) { throw new Error('', {cause() { return other; }}); }

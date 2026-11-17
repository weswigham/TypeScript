//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewErrorCauseFirstCauseOther.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error('', {cause: first, cause: other}); }

//// [input.ts]
try {} catch (error) { throw new Error('', {cause: first, cause: other}); }

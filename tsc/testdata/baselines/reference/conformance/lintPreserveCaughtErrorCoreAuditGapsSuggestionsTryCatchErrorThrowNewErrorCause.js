//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewErrorCause.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error('', {cause}); }

//// [input.ts]
try {} catch (error) { throw new Error('', {cause}); }

//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewErrorCauseOther.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error('', {cause: (other)}); }

//// [input.ts]
try {} catch (error) { throw new Error('', {cause: (other)}); }

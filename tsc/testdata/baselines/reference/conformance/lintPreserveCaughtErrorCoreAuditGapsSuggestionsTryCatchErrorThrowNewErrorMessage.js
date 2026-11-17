//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewErrorMessage.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error((message),); }

//// [input.ts]
try {} catch (error) { throw new Error((message),); }

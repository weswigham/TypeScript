//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewErrorExtra1.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error('', {extra: 1,}); }

//// [input.ts]
try {} catch (error) { throw new Error('', {extra: 1,}); }

//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewErrorCase2.ts] ////

//// [input.ts]
try {} catch (error) { throw new Error('', { }); }

//// [input.ts]
try {} catch (error) { throw new Error('', { }); }

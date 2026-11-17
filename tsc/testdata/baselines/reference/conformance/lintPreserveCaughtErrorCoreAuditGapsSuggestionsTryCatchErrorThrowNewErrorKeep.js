//// [tests/cases/conformance/lint/rules/preserve-caught-error/lintPreserveCaughtErrorCoreAuditGapsSuggestionsTryCatchErrorThrowNewErrorKeep.ts] ////

//// [input.ts]
try {} catch (error) { throw new (Error) /*keep*/ (); }

//// [input.ts]
try {} catch (error) { throw new (Error) /*keep*/ (); }

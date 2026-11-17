//// [tests/cases/conformance/lint/rules/no-restricted-syntax/lintNoRestrictedSyntaxRolloutRestrictionsUpstream294.ts] ////

//// [input.tsx]
async function f() { await using x = foo(); }

//// [input.tsx]
async function f() { await using x = foo(); }

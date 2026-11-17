//// [tests/cases/conformance/lint/rules/dot-notation/lintTypescriptDotNotationFinalOwnershipRulesProtectedAllowed.ts] ////

//// [input.ts]
class C { protected value = 1; } new C()['value'];

//// [input.ts]
class C { protected value = 1; } new C()['value'];

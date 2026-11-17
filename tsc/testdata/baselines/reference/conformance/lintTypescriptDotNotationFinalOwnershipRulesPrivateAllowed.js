//// [tests/cases/conformance/lint/rules/dot-notation/lintTypescriptDotNotationFinalOwnershipRulesPrivateAllowed.ts] ////

//// [input.ts]
class C { private value = 1; } new C()['value'];

//// [input.ts]
class C { private value = 1; } new C()['value'];

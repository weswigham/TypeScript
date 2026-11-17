//// [tests/cases/conformance/lint/rules/dot-notation/lintTypescriptDotNotationFinalOwnershipRulesUnicode.ts] ////

//// [input.ts]
declare const object: any; object['α'];

//// [input.ts]
declare const object: any; object.α;

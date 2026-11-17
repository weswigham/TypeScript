//// [tests/cases/conformance/lint/rules/dot-notation/lintTypescriptDotNotationFinalOwnershipRulesPattern.ts] ////

//// [input.ts]
declare const object: any; object['snake_case']; object['other'];

//// [input.ts]
declare const object: any; object['snake_case']; object.other;

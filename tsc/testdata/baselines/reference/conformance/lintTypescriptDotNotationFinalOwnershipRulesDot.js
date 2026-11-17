//// [tests/cases/conformance/lint/rules/dot-notation/lintTypescriptDotNotationFinalOwnershipRulesDot.ts] ////

//// [input.ts]
declare const object: { value: number }; object['value'];

//// [input.ts]
declare const object: { value: number }; object.value;

//// [tests/cases/conformance/lint/rules/dot-notation/lintTypescriptDotNotationFinalOwnershipRulesDeclaredWithIndex.ts] ////

//// [input.ts]
declare const object: { value: number; [key: string]: number }; object['value']; object['other'];

//// [input.ts]
declare const object: { value: number; [key: string]: number }; object.value; object['other'];

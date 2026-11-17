//// [tests/cases/conformance/lint/rules/dot-notation/lintTypescriptDotNotationFinalOwnershipFixesOptionalDotCase1.ts] ////

//// [input.ts]
declare const object: {value: number} | null; object?.['value'];

//// [input.ts]
declare const object: {value: number} | null; object?.value;

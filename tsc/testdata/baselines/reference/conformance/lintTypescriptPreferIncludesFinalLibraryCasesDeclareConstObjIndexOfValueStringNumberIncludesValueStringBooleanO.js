//// [tests/cases/conformance/lint/rules/prefer-includes/lintTypescriptPreferIncludesFinalLibraryCasesDeclareConstObjIndexOfValueStringNumberIncludesValueStringBooleanO.ts] ////

//// [input.ts]
declare const obj: {indexOf(value: string): number; includes(value: string): boolean}; obj.indexOf('a') >= 0;

//// [input.ts]
declare const obj: {indexOf(value: string): number; includes(value: string): boolean}; obj.includes('a');

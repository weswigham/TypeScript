//// [tests/cases/conformance/lint/rules/prefer-includes/lintTypescriptPreferIncludesFinalLibraryCasesDeclareConstObjIndexOfValueStringNumberIncludesOtherStringBooleanO.ts] ////

//// [input.ts]
declare const obj: {indexOf(value: string): number; includes(other: string): boolean}; obj.indexOf('a') >= 0;

//// [input.ts]
declare const obj: {indexOf(value: string): number; includes(other: string): boolean}; obj.indexOf('a') >= 0;

//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxInferrableExemptions.ts] ////

//// [input.ts]
let a: number; let b: any = 1; let c: 1 = 1; let d: number = new Number(1); let e: bigint = +10n;

//// [input.ts]
let a: number; let b: any = 1; let c: 1 = 1; let d: number = new Number(1); let e: bigint = +10n;

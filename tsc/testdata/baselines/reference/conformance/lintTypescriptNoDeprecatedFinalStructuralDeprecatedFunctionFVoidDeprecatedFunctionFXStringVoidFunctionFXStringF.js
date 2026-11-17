//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralDeprecatedFunctionFVoidDeprecatedFunctionFXStringVoidFunctionFXStringF.ts] ////

//// [input.ts]
function f(): void; /** @deprecated */ function f(x: string): void; function f(x?: string) {} f(); f('x');

//// [input.ts]
function f(): void; /** @deprecated */ function f(x: string): void; function f(x?: string) {} f(); f('x');

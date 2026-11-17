//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralSpreadDeclareConstAPromiseLikeNumberConstBA.ts] ////

//// [input.ts]
declare const a: PromiseLike<number>; const b = {...a};

//// [input.ts]
declare const a: PromiseLike<number>; const b = {...a};

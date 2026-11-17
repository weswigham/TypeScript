//// [tests/cases/conformance/lint/rules/require-await/lintTypescriptRequireAwaitRolloutPromisesEditsAsyncFunctionFAsyncGeneratorNumberYield1.ts] ////

//// [input.ts]
async function* f(): AsyncGenerator<number> { yield 1; }
export {};

//// [input.ts]
async function* f(): AsyncGenerator<number> { yield 1; }
export {};

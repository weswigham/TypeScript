//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitRolloutPromisesEditsConstFAsyncAwaitValue1.ts] ////

//// [input.ts]
const f = async () => await { value: 1 };
export {};

//// [input.ts]
const f = async () => ({ value: 1 });
export {};

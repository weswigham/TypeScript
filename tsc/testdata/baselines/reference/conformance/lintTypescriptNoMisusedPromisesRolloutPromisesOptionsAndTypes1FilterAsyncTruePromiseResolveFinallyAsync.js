//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypes1FilterAsyncTruePromiseResolveFinallyAsync.ts] ////

//// [input.ts]
[1].filter(async () => true); Promise.resolve().finally(async () => {});
export {};

//// [input.ts]
[1].filter(async () => true); Promise.resolve().finally(async () => {});
export {};

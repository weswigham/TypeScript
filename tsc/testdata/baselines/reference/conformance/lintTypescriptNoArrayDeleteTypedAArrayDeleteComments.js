//// [tests/cases/conformance/lint/rules/no-array-delete/lintTypescriptNoArrayDeleteTypedAArrayDeleteComments.ts] ////

//// [input.ts]
declare const arr: number[];
  delete /*keep*/ arr[0 /*key*/];

//// [input.ts]
declare const arr: number[];
  delete /*keep*/ arr[0 /*key*/];

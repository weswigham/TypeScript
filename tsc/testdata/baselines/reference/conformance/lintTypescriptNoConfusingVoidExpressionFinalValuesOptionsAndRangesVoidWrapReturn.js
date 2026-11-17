//// [tests/cases/conformance/lint/rules/no-confusing-void-expression/lintTypescriptNoConfusingVoidExpressionFinalValuesOptionsAndRangesVoidWrapReturn.ts] ////

//// [input.ts]
function fn() { return console.log(); }

//// [input.ts]
function fn() { return void console.log(); }

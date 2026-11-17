//// [tests/cases/conformance/lint/rules/no-confusing-void-expression/lintTypescriptNoConfusingVoidExpressionFinalValuesFixesAndSuggestionsFinalReturn.ts] ////

//// [input.ts]
function fn() { return console.log(); }

//// [input.ts]
function fn() { console.log(); }

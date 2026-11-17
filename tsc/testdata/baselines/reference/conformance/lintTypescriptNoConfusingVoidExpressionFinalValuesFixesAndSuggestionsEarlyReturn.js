//// [tests/cases/conformance/lint/rules/no-confusing-void-expression/lintTypescriptNoConfusingVoidExpressionFinalValuesFixesAndSuggestionsEarlyReturn.ts] ////

//// [input.ts]
function fn() { if (true) return console.log(); }

//// [input.ts]
function fn() { if (true) { console.log(); return; } }

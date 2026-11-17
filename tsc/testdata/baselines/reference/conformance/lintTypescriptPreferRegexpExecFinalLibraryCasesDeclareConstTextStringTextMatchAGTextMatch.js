//// [tests/cases/conformance/lint/rules/prefer-regexp-exec/lintTypescriptPreferRegexpExecFinalLibraryCasesDeclareConstTextStringTextMatchAGTextMatch.ts] ////

//// [input.ts]
declare const text: string; text.match(/a/g); text.match('[');

//// [input.ts]
declare const text: string; text.match(/a/g); text.match('[');

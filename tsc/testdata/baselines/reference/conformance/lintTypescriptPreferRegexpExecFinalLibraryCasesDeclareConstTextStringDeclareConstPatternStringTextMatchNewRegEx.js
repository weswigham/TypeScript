//// [tests/cases/conformance/lint/rules/prefer-regexp-exec/lintTypescriptPreferRegexpExecFinalLibraryCasesDeclareConstTextStringDeclareConstPatternStringTextMatchNewRegEx.ts] ////

//// [input.ts]
declare const text: string; declare const pattern: string; text.match(new RegExp(pattern));

//// [input.ts]
declare const text: string; declare const pattern: string; new RegExp(pattern).exec(text);

//// [tests/cases/conformance/lint/rules/prefer-regexp-exec/lintTypescriptPreferRegexpExecFinalLibraryCasesDeclareConstTextStringTextMatchAB.ts] ////

//// [input.ts]
declare const text: string; text.match('a/b');

//// [input.ts]
declare const text: string; /a\/b/.exec(text);

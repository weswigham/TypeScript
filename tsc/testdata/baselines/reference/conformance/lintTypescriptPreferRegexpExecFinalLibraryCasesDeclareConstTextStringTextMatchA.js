//// [tests/cases/conformance/lint/rules/prefer-regexp-exec/lintTypescriptPreferRegexpExecFinalLibraryCasesDeclareConstTextStringTextMatchA.ts] ////

//// [input.ts]
declare const text: string; text.match(/a/);

//// [input.ts]
declare const text: string; /a/.exec(text);

//// [tests/cases/conformance/lint/rules/prefer-regexp-exec/lintTypescriptPreferRegexpExecFinalLibraryCasesDeclareConstTextStringConstPatternAbTextMatchPattern.ts] ////

//// [input.ts]
declare const text: string; const pattern = 'ab'; text.match(pattern);

//// [input.ts]
declare const text: string; const pattern = 'ab'; RegExp(pattern).exec(text);

//// [tests/cases/conformance/lint/rules/prefer-includes/lintTypescriptPreferIncludesFinalLibraryCasesDeclareConstTextStringAX62TestText.ts] ////

//// [input.ts]
declare const text: string; /a\x62/.test(text);

//// [input.ts]
declare const text: string; text.includes('ab');

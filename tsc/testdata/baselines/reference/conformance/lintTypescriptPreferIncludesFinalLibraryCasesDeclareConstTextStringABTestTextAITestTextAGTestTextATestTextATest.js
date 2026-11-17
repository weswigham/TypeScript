//// [tests/cases/conformance/lint/rules/prefer-includes/lintTypescriptPreferIncludesFinalLibraryCasesDeclareConstTextStringABTestTextAITestTextAGTestTextATestTextATest.ts] ////

//// [input.ts]
declare const text: string; /a|b/.test(text); /a/i.test(text); /a/g.test(text); /[a]/.test(text); /a+/.test(text);

//// [input.ts]
declare const text: string; /a|b/.test(text); /a/i.test(text); /a/g.test(text); /[a]/.test(text); /a+/.test(text);

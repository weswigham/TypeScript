//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionFinalSimplifyInitial.ts] ////

//// [input.ts]
declare const text: string; `${text}`;

//// [input.ts]
declare const text: string; text;

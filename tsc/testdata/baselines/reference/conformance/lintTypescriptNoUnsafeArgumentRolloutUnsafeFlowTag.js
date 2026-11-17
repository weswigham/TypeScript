//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowTag.ts] ////

//// [input.ts]
declare function tag(x: TemplateStringsArray, value: string): void; tag`${1 as any}`;

//// [input.ts]
declare function tag(x: TemplateStringsArray, value: string): void; tag`${1 as any}`;

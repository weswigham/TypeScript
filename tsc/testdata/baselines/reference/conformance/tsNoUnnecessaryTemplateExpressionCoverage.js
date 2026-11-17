//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/tsNoUnnecessaryTemplateExpressionCoverage.ts] ////

//// [input.ts]
export {};
declare const text: string;
`${text}`;
`${1}`;
`use${"less"}`;
type Simplified = `foo${"bar"}baz`;
declare const number: 1;
`${number}`;
declare const union: string | number;
`${union}`;
declare function tag(strings: TemplateStringsArray, ...values: unknown[]): string;
tag`${"a"}${"b"}`;
function generic<T>(value: T) { return `${value}`; }

//// [input.ts]
export {};
declare const text: string;
text;
`1`;
`useless`;
type Simplified = `foobarbaz`;
declare const number: 1;
`${number}`;
declare const union: string | number;
`${union}`;
declare function tag(strings: TemplateStringsArray, ...values: unknown[]): string;
tag`${"a"}${"b"}`;
function generic<T>(value: T) { return `${value}`; }

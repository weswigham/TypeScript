// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-unnecessary-template-expression":"error"}},"files":["input.ts"]}
// @filename: input.ts
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
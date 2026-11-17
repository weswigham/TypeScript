// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-non-null-asserted-optional-chain":"error"}},"files":["input.ts"]}
// @filename: input.ts
export {};
declare const value: { field?: { next: number } } | undefined;
value?.field!;
(value?.field)!.next;
value?.field!.next;
value?.field;
value!.field;
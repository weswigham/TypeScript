// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/no-unsafe-member-access":["error",{"allowOptionalChaining":true}]}}}
// @filename: input.ts
declare const unsafe: any;
declare const safe: {value: string};
declare const key: any;
unsafe.outer.inner;
(unsafe.outer).inner;
unsafe?.outer;
unsafe?.outer.inner;
unsafe[key];
safe[key];
safe[key++];
safe.value;
unresolved.value;
interface Heritage extends Missing.Type {}
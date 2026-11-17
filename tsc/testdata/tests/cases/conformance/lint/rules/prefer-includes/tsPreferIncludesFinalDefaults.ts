// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/prefer-includes":"error"}}}
// @filename: input.ts
declare const values: number[];
declare const text: string;
declare const optional: string | undefined;
declare const custom: { indexOf(value: string): number; includes(value: string): boolean };
declare const incompatible: { indexOf(value: string): number; includes(other: string): boolean };
values.indexOf(1) !== -1;
text.indexOf("a") < 0;
optional?.indexOf("a") !== -1;
custom.indexOf("a") >= 0;
incompatible.indexOf("a") >= 0;
/a\x62/.test(text);
/a|b/.test(text);
/a/i.test(text);
/a/g.test(text);
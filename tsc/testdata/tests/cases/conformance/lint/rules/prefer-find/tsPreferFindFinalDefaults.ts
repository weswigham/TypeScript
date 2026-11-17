// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/prefer-find":"error"}}}
// @filename: input.ts
declare const values: readonly number[];
declare const optional: number[] | undefined;
declare const condition: boolean;
const zero = 0;
values.filter(value => value > 0)[zero];
values["filter"](Boolean).at(0);
(condition ? values.filter(Boolean) : values.filter(Boolean))[0];
optional?.filter(Boolean)[0];
values.filter(Boolean)?.[0];
values.filter(Boolean).at(1);
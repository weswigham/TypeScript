// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-irregular-whitespace":"error"}},"files":["input.ts"]}
// @filename: input.ts
constactual = 1;
//Comment whitespace.
const template = ``;
const value = '\u00a0';
const escaped = `\u00a0`;
const ordinary = 1;
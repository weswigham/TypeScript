// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/prefer-string-starts-ends-with":"error"}}}
// @filename: input.ts
declare const text: string;
text[0] === "a";
text[0] === "ab";
text[text.length - 1] !== "b";
text.indexOf("ab") === 0;
text.lastIndexOf("ab") === text.length - 2;
text.slice(0, 2) === "ab";
text.slice(-2) !== "ab";
text.substring(-2) === "ab";
text.match(/^ab/) === null;
/^a\x62/.test(text);
/ab$/.test(text);
/^ab$/.test(text);
/^ab/m.test(text);
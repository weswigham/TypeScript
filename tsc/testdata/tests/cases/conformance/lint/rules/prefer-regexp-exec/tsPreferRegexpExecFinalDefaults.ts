// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/prefer-regexp-exec":"error"}}}
// @filename: input.ts
declare const text: string;
declare const dynamic: string;
declare const unknownPattern: RegExp;
const fixed = "ab";
text.match(/ab/);
text.match("a/b");
text.match(fixed);
text.match(new RegExp(dynamic));
text.match(/ab/g);
text.match(unknownPattern);
text.match("[");
// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/prefer-string-starts-ends-with":["error",{"allowSingleElementEquality":"always"}]}}}
// @filename: input.ts
declare const text: string;
text[0] === "a";
text.charAt(0) === "a";
text[text.length - 1] === "a";
text.indexOf("ab") === 0;
text.slice(-2) === "ab";
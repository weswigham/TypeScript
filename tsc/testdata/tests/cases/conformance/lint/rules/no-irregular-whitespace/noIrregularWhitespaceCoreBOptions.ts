// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-irregular-whitespace":["error",{"skipComments":true,"skipStrings":false,"skipTemplates":true,"skipRegExps":true}]}},"files":["input.ts"]}
// @filename: input.ts
constvalue = '';
//Ignored comment.
const template = `${value}`;
const pattern = //;
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-iterator":"error"}},"files":["input.ts"]}
// @filename: input.ts
value.__iterator__;
value['__iterator__'];
value[`__iterator__`];
value?.__iterator__;
value[iterator];
({ __iterator__: value });
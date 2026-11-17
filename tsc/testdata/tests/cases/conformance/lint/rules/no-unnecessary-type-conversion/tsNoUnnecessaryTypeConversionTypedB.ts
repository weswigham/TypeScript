// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/no-unnecessary-type-conversion":"error"}}}
// @filename: input.ts
String("value");
Number(2);
Boolean(true);
BigInt(2n);
!!true;
++2;
~~2;
~~2.5;
function shadowed(String: (value: string) => string) { String("value"); }
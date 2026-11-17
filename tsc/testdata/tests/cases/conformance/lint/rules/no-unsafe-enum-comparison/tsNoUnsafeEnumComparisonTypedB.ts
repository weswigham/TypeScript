// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true},"lint":{"rules":{"@typescript-eslint/no-unsafe-enum-comparison":"error"}}}
// @filename: input.ts
enum Fruit { Apple = "apple", Pear = "pear" }
declare const fruit: Fruit;
fruit === "apple";
fruit === Fruit.Apple;
switch (fruit) { case "apple": break; }
declare const mixed: Fruit | "apple";
mixed === "apple";
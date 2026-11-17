//// [tests/cases/conformance/lint/rules/no-unsafe-enum-comparison/tsNoUnsafeEnumComparisonTypedB.ts] ////

//// [input.ts]
enum Fruit { Apple = "apple", Pear = "pear" }
declare const fruit: Fruit;
fruit === "apple";
fruit === Fruit.Apple;
switch (fruit) { case "apple": break; }
declare const mixed: Fruit | "apple";
mixed === "apple";

//// [input.ts]
enum Fruit { Apple = "apple", Pear = "pear" }
declare const fruit: Fruit;
fruit === "apple";
fruit === Fruit.Apple;
switch (fruit) { case "apple": break; }
declare const mixed: Fruit | "apple";
mixed === "apple";

//// [tests/cases/conformance/lint/rules/no-unsafe-enum-assignment/lintTypescriptNoUnsafeEnumAssignmentRolloutUnsafeFlowEnumInheritedMember.ts] ////

//// [input.ts]
enum Fruit { Apple } interface HasFruit {fruit: Fruit} class Basket implements HasFruit {fruit = 0;}

//// [input.ts]
enum Fruit { Apple } interface HasFruit {fruit: Fruit} class Basket implements HasFruit {fruit = 0;}

//// [tests/cases/conformance/lint/rules/no-useless-default-assignment/lintTypescriptNoUselessDefaultAssignmentFinalSimplifyDefaultDeclareConstValuesBooleanNumberStringConstHeadMiddl.ts] ////

//// [input.ts]
declare const values: [boolean, ...number[], string]; const [head, middle = 1, tail = 2] = values;

//// [input.ts]
declare const values: [boolean, ...number[], string]; const [head, middle = 1, tail = 2] = values;

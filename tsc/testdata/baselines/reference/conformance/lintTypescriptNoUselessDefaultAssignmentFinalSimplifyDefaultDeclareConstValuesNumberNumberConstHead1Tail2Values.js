//// [tests/cases/conformance/lint/rules/no-useless-default-assignment/lintTypescriptNoUselessDefaultAssignmentFinalSimplifyDefaultDeclareConstValuesNumberNumberConstHead1Tail2Values.ts] ////

//// [input.ts]
declare const values: [number, ...number[]]; const [head = 1, tail = 2] = values;

//// [input.ts]
declare const values: [number, ...number[]]; const [head = 1, tail = 2] = values;

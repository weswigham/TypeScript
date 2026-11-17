//// [tests/cases/conformance/lint/rules/no-useless-default-assignment/lintTypescriptNoUselessDefaultAssignmentFinalSimplifyDefaultDeclareConstValuesNestedValueNumberConstNestedValue.ts] ////

//// [input.ts]
declare const values: { nested: { value: number }[] }; const { nested: [{ value = 1 }] } = values;

//// [input.ts]
declare const values: { nested: { value: number }[] }; const { nested: [{ value = 1 }] } = values;

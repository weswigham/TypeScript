//// [tests/cases/conformance/lint/rules/prefer-reduce-type-parameter/lintTypescriptPreferReduceTypeParameterTypedCMembers12ReduceAccValueAccConcatValueAsNumber.ts] ////

//// [input.ts]
[1, 2].reduce((acc, value) => acc.concat(value), [] as number[]);

//// [input.ts]
[1, 2].reduce((acc, value) => acc.concat(value), [] as number[]);

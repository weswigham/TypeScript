//// [tests/cases/conformance/lint/rules/prefer-reduce-type-parameter/lintTypescriptPreferReduceTypeParameterTypedCMembers12ReduceAccValueAccConcatValueNumber.ts] ////

//// [input.ts]
[1, 2].reduce((acc, value) => acc.concat(value), <number[]>[]);

//// [input.ts]
[1, 2].reduce((acc, value) => acc.concat(value), <number[]>[]);

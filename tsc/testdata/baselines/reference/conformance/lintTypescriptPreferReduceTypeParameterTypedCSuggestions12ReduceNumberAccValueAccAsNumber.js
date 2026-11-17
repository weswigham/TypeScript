//// [tests/cases/conformance/lint/rules/prefer-reduce-type-parameter/lintTypescriptPreferReduceTypeParameterTypedCSuggestions12ReduceNumberAccValueAccAsNumber.ts] ////

//// [input.ts]
[1, 2].reduce<number[]>((acc, value) => acc, [] as number[]);

//// [input.ts]
[1, 2].reduce<number[]>((acc, value) => acc, [] as number[]);

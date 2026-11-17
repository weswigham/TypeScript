//// [tests/cases/conformance/lint/rules/prefer-reduce-type-parameter/tsPreferReduceTypeParameterTypedC.ts] ////

//// [input.ts]
[1, 2].reduce((acc, value) => acc.concat(value), [] as number[]);
[1, 2].reduce((acc, value) => acc.concat(value), <number[]>[]);
[1, 2].reduce<number[]>((acc, value) => acc.concat(value), []);
['a', 'b'].reduce((acc, key) => acc, {} as Record<'a' | 'b', boolean>);

//// [input.ts]
[1, 2].reduce((acc, value) => acc.concat(value), [] as number[]);
[1, 2].reduce((acc, value) => acc.concat(value), <number[]>[]);
[1, 2].reduce<number[]>((acc, value) => acc.concat(value), []);
['a', 'b'].reduce((acc, key) => acc, {} as Record<'a' | 'b', boolean>);

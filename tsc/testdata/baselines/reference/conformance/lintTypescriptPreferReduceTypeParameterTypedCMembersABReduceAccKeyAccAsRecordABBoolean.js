//// [tests/cases/conformance/lint/rules/prefer-reduce-type-parameter/lintTypescriptPreferReduceTypeParameterTypedCMembersABReduceAccKeyAccAsRecordABBoolean.ts] ////

//// [input.ts]
['a', 'b'].reduce((acc, key) => acc, {} as Record<'a' | 'b', boolean>);

//// [input.ts]
['a', 'b'].reduce((acc, key) => acc, {} as Record<'a' | 'b', boolean>);

//// [tests/cases/conformance/lint/rules/prefer-return-this-type/lintTypescriptPreferReturnThisTypeTypedCFunctionsClassExampleTMethodExampleTUndefinedReturnThis.ts] ////

//// [input.ts]
class Example<T> { method(): Example<T> | undefined { return this; } }

//// [input.ts]
class Example<T> { method(): Example<T> | undefined { return this; } }

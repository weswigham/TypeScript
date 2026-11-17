//// [tests/cases/conformance/lint/rules/prefer-return-this-type/lintTypescriptPreferReturnThisTypeTypedCFunctionsClassExampleMethodExampleConstSelfThisReturnSelf.ts] ////

//// [input.ts]
class Example { method(): Example { const self = this; return self; } }

//// [input.ts]
class Example { method(): Example { const self = this; return self; } }

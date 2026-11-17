//// [tests/cases/conformance/lint/rules/prefer-return-this-type/lintTypescriptPreferReturnThisTypeTypedCFunctionsClassExampleMethodValueExampleExampleReturnMathRandomValueThis.ts] ////

//// [input.ts]
class Example { method(value: Example): Example { return Math.random() ? value : this; } }

//// [input.ts]
class Example { method(value: Example): Example { return Math.random() ? value : this; } }

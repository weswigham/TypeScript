//// [tests/cases/conformance/lint/rules/no-unsafe-optional-chaining/lintNoUnsafeOptionalChainingCoreDFooObjBarObjListFunctionFooYieldObjValue.ts] ////

//// [input.ts]
[{ foo } = obj?.bar] = []; [...obj?.list]; function* foo() { yield* obj?.value; }

//// [input.ts]
[{ foo } = obj?.bar] = []; [...obj?.list]; function* foo() { yield* obj?.value; }

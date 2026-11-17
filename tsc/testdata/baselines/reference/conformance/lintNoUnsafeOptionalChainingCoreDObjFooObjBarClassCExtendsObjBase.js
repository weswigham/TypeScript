//// [tests/cases/conformance/lint/rules/no-unsafe-optional-chaining/lintNoUnsafeOptionalChainingCoreDObjFooObjBarClassCExtendsObjBase.ts] ////

//// [input.ts]
(obj?.foo && obj?.bar)(); class C extends obj?.base {}

//// [input.ts]
(obj?.foo && obj?.bar)(); class C extends obj?.base {}

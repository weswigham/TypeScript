//// [tests/cases/conformance/lint/rules/no-useless-constructor/lintNoUselessConstructorRolloutDeclarationsConstructorsClassAExtendsBConstructorXInitSuperX.ts] ////

//// [input.ts]
class A extends B { constructor(x = init()) { super(x); } }

//// [input.ts]
class A extends B { constructor(x = init()) { super(x); } }

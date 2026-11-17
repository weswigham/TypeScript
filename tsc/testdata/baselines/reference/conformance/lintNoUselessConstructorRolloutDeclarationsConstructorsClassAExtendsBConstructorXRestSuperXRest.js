//// [tests/cases/conformance/lint/rules/no-useless-constructor/lintNoUselessConstructorRolloutDeclarationsConstructorsClassAExtendsBConstructorXRestSuperXRest.ts] ////

//// [input.ts]
class A extends B { constructor(x, ...rest) { super(x, ...rest); } }

//// [input.ts]
class A extends B { constructor(x, ...rest) { super(x, ...rest); } }

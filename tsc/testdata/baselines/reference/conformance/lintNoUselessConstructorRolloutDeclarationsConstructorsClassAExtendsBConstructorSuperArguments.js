//// [tests/cases/conformance/lint/rules/no-useless-constructor/lintNoUselessConstructorRolloutDeclarationsConstructorsClassAExtendsBConstructorSuperArguments.ts] ////

//// [input.ts]
class A extends B { constructor() { super(...arguments); } }

//// [input.ts]
class A extends B { constructor() { super(...arguments); } }

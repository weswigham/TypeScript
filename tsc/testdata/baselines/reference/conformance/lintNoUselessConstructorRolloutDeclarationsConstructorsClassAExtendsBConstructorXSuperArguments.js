//// [tests/cases/conformance/lint/rules/no-useless-constructor/lintNoUselessConstructorRolloutDeclarationsConstructorsClassAExtendsBConstructorXSuperArguments.ts] ////

//// [input.ts]
class A extends B { constructor({x}) { super(...arguments); } }

//// [input.ts]
class A extends B { constructor({x}) { super(...arguments); } }

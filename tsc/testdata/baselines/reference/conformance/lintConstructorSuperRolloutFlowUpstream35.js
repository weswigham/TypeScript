//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream35.ts] ////

//// [input.ts]
class A extends Object {
    constructor() {
        super();
        for (; i < 0; i++);
    }
}

//// [input.ts]
class A extends Object {
    constructor() {
        super();
        for (; i < 0; i++);
    }
}

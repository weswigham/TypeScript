//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream37.ts] ////

//// [input.ts]
class A extends Object {
    constructor() {
        super();
        for (let i = 0; i < 0;);
    }
}

//// [input.ts]
class A extends Object {
    constructor() {
        super();
        for (let i = 0; i < 0;);
    }
}

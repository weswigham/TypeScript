//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream114.ts] ////

//// [input.ts]
class A extends Object {
    constructor() {
        super();
        for (let i = 0; i < 0; i++);
        this;
    }
}

//// [input.ts]
class A extends Object {
    constructor() {
        super();
        for (let i = 0; i < 0; i++);
        this;
    }
}

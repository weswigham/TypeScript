//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream38.ts] ////

//// [input.ts]
class A extends Object {
    constructor() {
        super();
        for (let i = 0;;) {
            if (foo) break;
        }
    }
}

//// [input.ts]
class A extends Object {
    constructor() {
        super();
        for (let i = 0;;) {
            if (foo) break;
        }
    }
}

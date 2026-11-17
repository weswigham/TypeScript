//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream36.ts] ////

//// [input.ts]
class A extends Object {
    constructor() {
        super();
        for (let i = 0;; i++) {
            if (foo) break;
        }
    }
}

//// [input.ts]
class A extends Object {
    constructor() {
        super();
        for (let i = 0;; i++) {
            if (foo) break;
        }
    }
}

//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream110.ts] ////

//// [input.ts]
class A extends B {
            constructor() {
                while (foo) {
                    if (init) {
                        super();
                        this.a();
                    }
                }
            }
        }

//// [input.ts]
class A extends B {
            constructor() {
                while (foo) {
                    if (init) {
                        super();
                        this.a();
                    }
                }
            }
        }

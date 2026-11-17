//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream143.ts] ////

//// [input.ts]

            class A extends B {
                constructor() {
                    while (foo) {
                        this.a();
                        super();
                    }
                }
            }

//// [input.ts]

            class A extends B {
                constructor() {
                    while (foo) {
                        this.a();
                        super();
                    }
                }
            }

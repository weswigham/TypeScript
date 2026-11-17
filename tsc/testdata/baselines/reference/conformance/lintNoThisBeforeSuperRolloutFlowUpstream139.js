//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream139.ts] ////

//// [input.ts]

            class A extends B {
                constructor() {
                    if (foo) {
                        if (bar) { }
                        super();
                    }
                    this.a();
                }
            }

//// [input.ts]

            class A extends B {
                constructor() {
                    if (foo) {
                        if (bar) { }
                        super();
                    }
                    this.a();
                }
            }

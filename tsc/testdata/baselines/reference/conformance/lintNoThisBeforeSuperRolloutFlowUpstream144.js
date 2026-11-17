//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream144.ts] ////

//// [input.ts]

            class A extends B {
                constructor() {
                    while (foo) {
                        if (init) {
                            this.a();
                            super();
                        }
                    }
                }
            }

//// [input.ts]

            class A extends B {
                constructor() {
                    while (foo) {
                        if (init) {
                            this.a();
                            super();
                        }
                    }
                }
            }

//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream141.ts] ////

//// [input.ts]

            class A extends B {
                constructor() {
                    try {
                        call();
                    } finally {
                        this.a();
                    }
                }
            }

//// [input.ts]

            class A extends B {
                constructor() {
                    try {
                        call();
                    } finally {
                        this.a();
                    }
                }
            }

//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream140.ts] ////

//// [input.ts]

            class A extends B {
                constructor() {
                    if (foo) {
                    } else {
                      super();
                    }
                    this.a();
                }
            }

//// [input.ts]

            class A extends B {
                constructor() {
                    if (foo) {
                    } else {
                      super();
                    }
                    this.a();
                }
            }

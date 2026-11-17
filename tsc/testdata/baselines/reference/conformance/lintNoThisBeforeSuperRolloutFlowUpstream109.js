//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream109.ts] ////

//// [input.ts]
class A extends B {
            constructor() {
                while (foo) {
                    super();
                    this.a();
                }
            }
        }

//// [input.ts]
class A extends B {
            constructor() {
                while (foo) {
                    super();
                    this.a();
                }
            }
        }

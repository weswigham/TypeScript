//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream551.ts] ////

//// [input.ts]

                function* foo() {
                    try {
                        return;
                    } catch (err) {
                        return err;
                    }
                }

//// [input.ts]

                function* foo() {
                    try {
                        return;
                    } catch (err) {
                        return err;
                    }
                }

//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream553.ts] ////

//// [input.ts]

                function foo() {
                    try {
                        return;
                        let a = 1;
                    } catch (err) {
                        return err;
                    }
                }

//// [input.ts]

                function foo() {
                    try {
                        return;
                        let a = 1;
                    } catch (err) {
                        return err;
                    }
                }

//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream549.ts] ////

//// [input.ts]

                function foo() {
                    if (a) {
                        return
                        b();
                        c();
                    } else {
                        throw err
                        d();
                    }
                }
            

//// [input.ts]

                function foo() {
                    if (a) {
                        return
                        b();
                        c();
                    } else {
                        throw err
                        d();
                    }
                }
            

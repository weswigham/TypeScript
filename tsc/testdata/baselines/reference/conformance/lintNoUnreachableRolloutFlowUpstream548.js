//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream548.ts] ////

//// [input.ts]

                function foo() {
                    return;

                    a();

                    if (b()) {
                        c()
                    } else {
                        d()
                    }
                }
            

//// [input.ts]

                function foo() {
                    return;

                    a();

                    if (b()) {
                        c()
                    } else {
                        d()
                    }
                }
            

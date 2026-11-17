//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream547.ts] ////

//// [input.ts]

                function foo() {
                    return;

                    a();  // ← ERROR: Unreachable code. (no-unreachable)

                    b()   // ↑ ';' token is included in the unreachable code, so this statement will be merged.
                    // comment
                    c();  // ↑ ')' token is included in the unreachable code, so this statement will be merged.
                }
            

//// [input.ts]

                function foo() {
                    return;

                    a();  // ← ERROR: Unreachable code. (no-unreachable)

                    b()   // ↑ ';' token is included in the unreachable code, so this statement will be merged.
                    // comment
                    c();  // ↑ ')' token is included in the unreachable code, so this statement will be merged.
                }
            

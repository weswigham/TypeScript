//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamClassFooStaticLetVUsedConsoleLogVVUnused.ts] ////

//// [globals.d.ts]

//// [input.ts]
class foo {
                static {
                    let v = 'used';
                    console.log(v);
                    v = 'unused'
                }
            }

//// [input.ts]
class foo {
                static {
                    let v = 'used';
                    console.log(v);
                    v = 'unused'
                }
            }

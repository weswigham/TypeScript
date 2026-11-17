//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamClassFooStaticLetVUsedConsoleLogVVUsed2ConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
class foo {
            static {
                let v = 'used';
                console.log(v);
                v = 'used-2'
                console.log(v);
            }
        }

//// [input.ts]
class foo {
            static {
                let v = 'used';
                console.log(v);
                v = 'used-2'
                console.log(v);
            }
        }

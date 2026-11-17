//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUsedConsoleLogVVUsed2ConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
            let v = 'used';
            console.log(v);
            v = 'used-2';
            console.log(v);
        }

//// [input.ts]
function foo() {
            let v = 'used';
            console.log(v);
            v = 'used-2';
            console.log(v);
        }

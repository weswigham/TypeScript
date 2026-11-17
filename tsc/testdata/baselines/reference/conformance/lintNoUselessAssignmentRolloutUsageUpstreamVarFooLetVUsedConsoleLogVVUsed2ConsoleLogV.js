//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamVarFooLetVUsedConsoleLogVVUsed2ConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
var foo = () => {
            let v = 'used';
            console.log(v);
            v = 'used-2'
            console.log(v);
        }

//// [input.ts]
var foo = () => {
            let v = 'used';
            console.log(v);
            v = 'used-2'
            console.log(v);
        }

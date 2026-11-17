//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetAUsedBUsedCUsedDUsedConsoleLogABCDAArrBCDFnConsoleLogC.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
                let a = 'used', b = 'used', c = 'used', d = 'used';
                console.log(a, b, c, d);
                ({ a, arr: [b, c,, ...d] } = fn());
                console.log(c);
            }

//// [input.ts]
function foo() {
                let a = 'used', b = 'used', c = 'used', d = 'used';
                console.log(a, b, c, d);
                ({ a, arr: [b, c,, ...d] } = fn());
                console.log(c);
            }

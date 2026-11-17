//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetAConsoleLogAABUnusedLikeButMaybeUsedInSetter.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
            let a = {};
            console.log(a);
            a.b = 'unused like, but maybe used in setter';
        }

//// [input.ts]
function foo() {
            let a = {};
            console.log(a);
            a.b = 'unused like, but maybe used in setter';
        }

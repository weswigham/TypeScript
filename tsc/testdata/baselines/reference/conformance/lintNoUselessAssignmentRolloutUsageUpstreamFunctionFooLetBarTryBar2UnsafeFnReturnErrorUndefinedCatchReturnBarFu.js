//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetBarTryBar2UnsafeFnReturnErrorUndefinedCatchReturnBarFu.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(){
            let bar;
            try {
                bar = 2;
                unsafeFn();
                return { error: undefined };
            } catch {
                return { bar }; 
            }
        }   
        function unsafeFn() {
            throw new Error();
        }

//// [input.ts]
function foo(){
            let bar;
            try {
                bar = 2;
                unsafeFn();
                return { error: undefined };
            } catch {
                return { bar }; 
            }
        }   
        function unsafeFn() {
            throw new Error();
        }

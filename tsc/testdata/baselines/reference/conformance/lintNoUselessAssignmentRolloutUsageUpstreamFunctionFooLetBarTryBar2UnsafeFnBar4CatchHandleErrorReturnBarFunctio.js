//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetBarTryBar2UnsafeFnBar4CatchHandleErrorReturnBarFunctio.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(){
            let bar;
            try {
                bar = 2;
                unsafeFn();
                bar = 4;
            } catch {
               // handle error
            }
            return bar;
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
                bar = 4;
            } catch {
               // handle error
            }
            return bar;
        }   
        function unsafeFn() {
            throw new Error();
        }

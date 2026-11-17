//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetBarBazTryBar2UnsafeFnReturnErrorUndefinedCatchBazBarRe.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(){
            let bar, baz;
            try {
                bar = 2;
                unsafeFn();
                return { error: undefined };
            } catch {
               baz = bar;
            }
            return baz;
        }   
        function unsafeFn() {
            throw new Error();
        }

//// [input.ts]
function foo(){
            let bar, baz;
            try {
                bar = 2;
                unsafeFn();
                return { error: undefined };
            } catch {
               baz = bar;
            }
            return baz;
        }   
        function unsafeFn() {
            throw new Error();
        }

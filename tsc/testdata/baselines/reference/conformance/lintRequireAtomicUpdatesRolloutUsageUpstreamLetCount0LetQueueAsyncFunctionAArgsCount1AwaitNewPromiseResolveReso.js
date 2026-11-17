//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetCount0LetQueueAsyncFunctionAArgsCount1AwaitNewPromiseResolveReso.ts] ////

//// [globals.d.ts]

//// [input.ts]

            let count = 0
            let queue = []
            async function A(...args) {
                count += 1
                await new Promise(resolve=>resolve())
                count -= 1
                return
            }
        

//// [input.ts]

            let count = 0
            let queue = []
            async function A(...args) {
                count += 1
                await new Promise(resolve=>resolve())
                count -= 1
                return
            }
        

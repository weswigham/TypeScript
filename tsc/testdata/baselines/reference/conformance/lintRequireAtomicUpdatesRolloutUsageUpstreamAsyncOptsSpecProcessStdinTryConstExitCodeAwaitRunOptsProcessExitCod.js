//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncOptsSpecProcessStdinTryConstExitCodeAwaitRunOptsProcessExitCod.ts] ////

//// [globals.d.ts]
declare var process: any;

//// [input.ts]

                async () => {
                    opts.spec = process.stdin;
                    try {
                        const { exit_code } = await run(opts);
                        process.exitCode = exit_code;
                    } catch (e) {
                        process.exitCode = 1;
                    }
              };
            

//// [input.ts]

                async () => {
                    opts.spec = process.stdin;
                    try {
                        const { exit_code } = await run(opts);
                        process.exitCode = exit_code;
                    } catch (e) {
                        process.exitCode = 1;
                    }
              };
            

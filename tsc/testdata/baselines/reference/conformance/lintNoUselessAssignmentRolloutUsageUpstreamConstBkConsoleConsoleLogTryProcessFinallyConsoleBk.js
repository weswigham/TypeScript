//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamConstBkConsoleConsoleLogTryProcessFinallyConsoleBk.ts] ////

//// [globals.d.ts]
declare var console: any;

//// [input.ts]

            const bk = console;
            console = { log () {} };
            try {
                // process
            } finally {
                console = bk;
            }

//// [input.ts]

            const bk = console;
            console = { log () {} };
            try {
                // process
            } finally {
                console = bk;
            }

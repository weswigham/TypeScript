// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/require-atomic-updates/_________________async_()_=>_{_____________________opts.spec_=_process.stdin;_____________________try_{_________________________const_{_exit_code_}_=_await_run(opts);_________________________process.exitCode_=_exit_code;_____________________}_catch_(e)_{_________________________process.exitCode_=_1;_____________________}_______________};_____________ (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "moduleDetection": "force",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "require-atomic-updates": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts
declare var process: any;

// @filename: /input.ts

                async () => {
                    opts.spec = process.stdin;
                    try {
                        const { exit_code } = await run(opts);
                        process.exitCode = exit_code;
                    } catch (e) {
                        process.exitCode = 1;
                    }
              };
            
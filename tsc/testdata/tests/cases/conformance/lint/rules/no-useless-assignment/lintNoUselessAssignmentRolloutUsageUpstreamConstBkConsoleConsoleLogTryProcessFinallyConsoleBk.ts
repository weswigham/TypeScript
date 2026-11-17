// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/_____________const_bk_=_console;_____________console_=_{_log_()_{}_};_____________try_{_________________//_process_____________}_finally_{_________________console_=_bk;_____________} (invocation 1).
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
            "no-useless-assignment": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts
declare var console: any;

// @filename: /input.ts

            const bk = console;
            console = { log () {} };
            try {
                // process
            } finally {
                console = bk;
            }
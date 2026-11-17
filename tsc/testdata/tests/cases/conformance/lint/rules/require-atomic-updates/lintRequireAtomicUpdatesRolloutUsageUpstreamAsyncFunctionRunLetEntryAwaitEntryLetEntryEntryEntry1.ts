// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/require-atomic-updates/_____________async_function_run()_{_______________{_________________let_entry;_________________await_entry;_______________}_______________{_________________let_entry;_________________()_=>_entry;__________________entry_=_1;_______________}_____________}_________ (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "moduleDetection": "legacy",
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

// @filename: /input.ts

            async function run() {
              {
                let entry;
                await entry;
              }
              {
                let entry;
                () => entry;

                entry = 1;
              }
            }
        
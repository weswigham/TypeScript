// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/require-atomic-updates/_____________async_function_foo(e)_{_____________}______________async_function_run()_{_______________const_input_=_[];_______________const_props_=_[];________________for(const_entry_of_input)_{_________________const_prop_=_props.find(a_=>_a.id_===_entry.id)_||_null;_________________await_foo(entry);_______________}________________for(const_entry_of_input)_{_________________const_prop_=_props.find(a_=>_a.id_===_entry.id)_||_null;_______________}________________for(const_entry2_of_input)_{_________________const_prop_=_props.find(a_=>_a.id_===_entry2.id)_||_null;_______________}_____________}_________ (invocation 1).
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

            async function foo(e) {
            }

            async function run() {
              const input = [];
              const props = [];

              for(const entry of input) {
                const prop = props.find(a => a.id === entry.id) || null;
                await foo(entry);
              }

              for(const entry of input) {
                const prop = props.find(a => a.id === entry.id) || null;
              }

              for(const entry2 of input) {
                const prop = props.find(a => a.id === entry2.id) || null;
              }
            }
        
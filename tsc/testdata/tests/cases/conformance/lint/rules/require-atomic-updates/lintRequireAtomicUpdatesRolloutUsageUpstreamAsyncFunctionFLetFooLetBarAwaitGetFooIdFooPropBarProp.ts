// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/require-atomic-updates/_____________async_function_f()_{_________________let_foo_=_{}_________________let_bar_=_await_get(foo.id);_________________foo.prop_=_bar.prop;_____________}_________ (invocation 1).
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

            async function f() {
                let foo = {}
                let bar = await get(foo.id);
                foo.prop = bar.prop;
            }
        
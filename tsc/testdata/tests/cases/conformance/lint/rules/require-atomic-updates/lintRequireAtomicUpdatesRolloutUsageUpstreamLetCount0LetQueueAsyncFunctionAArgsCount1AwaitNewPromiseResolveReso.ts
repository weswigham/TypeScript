// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/require-atomic-updates/_____________let_count_=_0_____________let_queue_=_[]_____________async_function_A(...args)_{_________________count_+=_1_________________await_new_Promise(resolve=>resolve())_________________count_-=_1_________________return_____________}_________ (invocation 1).
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

            let count = 0
            let queue = []
            async function A(...args) {
                count += 1
                await new Promise(resolve=>resolve())
                count -= 1
                return
            }
        
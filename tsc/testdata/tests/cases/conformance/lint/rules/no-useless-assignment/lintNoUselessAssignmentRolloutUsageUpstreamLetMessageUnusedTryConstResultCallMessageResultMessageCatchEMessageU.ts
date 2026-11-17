// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/let_message_=_'unused';_____________try_{_________________const_result_=_call();_________________message_=_result.message;_____________}_catch_(e)_{_________________message_=_'used';_____________}_____________console.log(message) (invocation 1).
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

// @filename: /input.ts
let message = 'unused';
            try {
                const result = call();
                message = result.message;
            } catch (e) {
                message = 'used';
            }
            console.log(message)
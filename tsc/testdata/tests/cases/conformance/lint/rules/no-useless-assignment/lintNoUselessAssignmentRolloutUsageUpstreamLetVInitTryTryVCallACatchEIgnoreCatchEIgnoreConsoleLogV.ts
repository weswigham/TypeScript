// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/let_v_=_'init';_________try_{_____________try_{_________________v_=_callA();_____________}_catch_(e)_{_________________//_ignore_____________}_________}_catch_(e)_{_____________//_ignore_________}_________console.log(v) (invocation 1).
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
let v = 'init';
        try {
            try {
                v = callA();
            } catch (e) {
                // ignore
            }
        } catch (e) {
            // ignore
        }
        console.log(v)
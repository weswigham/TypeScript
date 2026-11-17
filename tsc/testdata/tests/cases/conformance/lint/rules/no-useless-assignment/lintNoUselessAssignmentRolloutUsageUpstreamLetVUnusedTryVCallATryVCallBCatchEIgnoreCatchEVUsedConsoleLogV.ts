// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/let_v_=_'unused';_____________try_{_________________v_=_callA();_________________try_{_____________________v_=_callB();_________________}_catch_(e)_{_____________________//_ignore_________________}_____________}_catch_(e)_{_________________v_=_'used';_____________}_____________console.log(v) (invocation 1).
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
let v = 'unused';
            try {
                v = callA();
                try {
                    v = callB();
                } catch (e) {
                    // ignore
                }
            } catch (e) {
                v = 'used';
            }
            console.log(v)
// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function*_generator()_{_____________let_done_=_false;_____________try_{_________________yield_1;_________________done_=_true;_________________yield_2;_____________}_finally_{_________________if_(done)_{_____________________console.log("done_is_true");_________________}_____________}_________} (invocation 1).
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
function* generator() {
            let done = false;
            try {
                yield 1;
                done = true;
                yield 2;
            } finally {
                if (done) {
                    console.log("done is true");
                }
            }
        }
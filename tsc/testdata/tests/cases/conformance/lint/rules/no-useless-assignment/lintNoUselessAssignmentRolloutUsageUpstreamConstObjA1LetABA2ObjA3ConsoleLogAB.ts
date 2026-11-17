// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/const_obj_=_{_a:_1_};_____________let_{_________________a,_________________b_=_(a_=_2)_____________}_=_obj;_____________a_=_3_____________console.log(a,_b); (invocation 1).
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
const obj = { a: 1 };
            let {
                a,
                b = (a = 2)
            } = obj;
            a = 3
            console.log(a, b);
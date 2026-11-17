// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-unused-vars/const_array_=_['a',_'b',_'c'];_const_[a,__b,_c]_=_array;_const_fooArray_=_['foo'];_const_barArray_=_['bar'];_const_ignoreArray_=_['ignore']; (invocation 1).
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
            "no-unused-vars": [
                "error",
                {
                    "destructuredArrayIgnorePattern": "^_",
                    "varsIgnorePattern": "ignore"
                }
            ]
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts
const array = ['a', 'b', 'c'];
const [a, _b, c] = array;
const fooArray = ['foo'];
const barArray = ['bar'];
const ignoreArray = ['ignore'];
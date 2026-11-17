// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-unused-vars/const_data_=_{_defaults:_{_x:_0_},_x:_1,_y:_2_};_const_{_defaults:_{_x_},_...coords_}_=_data;__console.log(coords) (invocation 1).
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
            "no-unused-vars": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts
const data = { defaults: { x: 0 }, x: 1, y: 2 };
const { defaults: { x }, ...coords } = data;
 console.log(coords)
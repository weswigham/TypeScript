// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-unused-vars/_____________//_doesn't_report__x_____________let__x,_y;______________x_=_1;_____________[_x,_y]_=_foo;_____________y;______________//_doesn't_report__a_____________let__a,_b;_____________[_a,_b]_=_foo;______________a_=_1;_____________b;_____________ (invocation 1).
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
                    "destructuredArrayIgnorePattern": "^_"
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

            // doesn't report _x
            let _x, y;
            _x = 1;
            [_x, y] = foo;
            y;

            // doesn't report _a
            let _a, b;
            [_a, b] = foo;
            _a = 1;
            b;
            
// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/require-atomic-updates/_____________async_function_foo()_{_________________return_[_____________________1_?_a_:_b,_____________________2_?_a_:_b,_____________________3_?_a_:_b,_____________________4_?_a_:_b,_____________________5_?_a_:_b,_____________________6_?_a_:_b,_____________________7_?_a_:_b,_____________________8_?_a_:_b,_____________________9_?_a_:_b,_____________________10_?_a_:_b,_____________________11_?_a_:_b,_____________________12_?_a_:_b,_____________________13_?_a_:_b,_____________________14_?_a_:_b,_____________________15_?_a_:_b,_____________________16_?_a_:_b,_____________________17_?_a_:_b,_____________________18_?_a_:_b,_____________________19_?_a_:_b,_____________________20_?_a_:_b_________________];_____________}_________ (invocation 1).
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

            async function foo() {
                return [
                    1 ? a : b,
                    2 ? a : b,
                    3 ? a : b,
                    4 ? a : b,
                    5 ? a : b,
                    6 ? a : b,
                    7 ? a : b,
                    8 ? a : b,
                    9 ? a : b,
                    10 ? a : b,
                    11 ? a : b,
                    12 ? a : b,
                    13 ? a : b,
                    14 ? a : b,
                    15 ? a : b,
                    16 ? a : b,
                    17 ? a : b,
                    18 ? a : b,
                    19 ? a : b,
                    20 ? a : b
                ];
            }
        
// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestConstantBinaryRelationalComparisons/1_<_2;_2_>=_3;_`a`_>_'b';_+1_<=_-1;_undefined_>_0; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-constant-binary-expression": [
                "error",
                {
                    "checkRelationalComparisons": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
1 < 2; 2 >= 3; `a` > 'b'; +1 <= -1; undefined > 0;
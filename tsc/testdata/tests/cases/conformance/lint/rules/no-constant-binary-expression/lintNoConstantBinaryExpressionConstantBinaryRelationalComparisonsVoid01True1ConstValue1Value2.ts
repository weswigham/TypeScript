// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestConstantBinaryRelationalComparisons/void_0_<_1;_!true_<_1;_const_value_=_1;_value_<_2; (invocation 2).
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
void 0 < 1; !true < 1; const value = 1; value < 2;
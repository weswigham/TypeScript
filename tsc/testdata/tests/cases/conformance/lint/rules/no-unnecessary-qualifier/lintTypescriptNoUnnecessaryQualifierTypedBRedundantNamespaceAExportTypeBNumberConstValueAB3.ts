// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBRedundant/no-unnecessary-qualifier/namespace_A_{_export_type_B_=_number;_const_value:_A.B_=_3;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unnecessary-qualifier": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
namespace A { export type B = number; const value: A.B = 3; }
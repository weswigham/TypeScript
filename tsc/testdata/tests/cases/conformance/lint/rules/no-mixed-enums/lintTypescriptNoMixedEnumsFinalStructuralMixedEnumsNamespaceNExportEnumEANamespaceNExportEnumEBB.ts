// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralMixedEnums/namespace_N_{_export_enum_E_{_A_}_}_namespace_N_{_export_enum_E_{_B_=_'b'_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-mixed-enums": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
namespace N { export enum E { A } } namespace N { export enum E { B = 'b' } }
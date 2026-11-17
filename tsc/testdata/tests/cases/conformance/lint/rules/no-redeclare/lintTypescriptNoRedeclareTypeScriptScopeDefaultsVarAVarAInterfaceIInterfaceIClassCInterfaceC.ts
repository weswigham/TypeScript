// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-redeclare/var_a;_var_a;_interface_I_{}_interface_I_{}_class_C_{}_interface_C_{} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-redeclare": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
var a; var a; interface I {} interface I {} class C {} interface C {}
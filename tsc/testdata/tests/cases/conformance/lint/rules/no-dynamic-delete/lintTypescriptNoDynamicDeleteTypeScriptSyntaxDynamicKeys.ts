// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoDynamicDelete/dynamic_keys (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-dynamic-delete": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
delete value[key]; delete value['key']; delete value[-1]; delete value[`key`];
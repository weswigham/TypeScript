// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoScriptUrl/'JavaScript:';_`javascript:`;_tag`javascript:`;_`javascript:${foo}` (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-script-url": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
'JavaScript:'; `javascript:`; tag`javascript:`; `javascript:${foo}`
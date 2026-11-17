// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoTemplateCurlyInString/'Hello,_${name}';_'${}';_`${name}` (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-template-curly-in-string": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
'Hello, ${name}'; '${}'; `${name}`
// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnusedExpressions/no-unused-expressions/value_as_any;_value!;_Map<string,_number>; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unused-expressions": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
value as any; value!; Map<string, number>;
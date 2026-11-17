// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalLibraryCases/prefer-includes/declare_const_obj:_{indexOf(value:_string):_number};_obj.indexOf('a')_>=_0; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-includes": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const obj: {indexOf(value: string): number}; obj.indexOf('a') >= 0;
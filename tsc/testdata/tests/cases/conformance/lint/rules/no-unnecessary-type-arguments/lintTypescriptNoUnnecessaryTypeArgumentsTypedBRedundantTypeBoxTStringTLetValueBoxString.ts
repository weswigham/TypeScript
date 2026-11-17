// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBRedundant/no-unnecessary-type-arguments/type_Box<T_=_string>_=_T[];_let_value:_Box<string>; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unnecessary-type-arguments": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type Box<T = string> = T[]; let value: Box<string>;
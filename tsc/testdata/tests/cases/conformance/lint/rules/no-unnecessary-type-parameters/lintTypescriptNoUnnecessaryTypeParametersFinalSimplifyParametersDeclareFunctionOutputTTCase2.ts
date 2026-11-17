// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyParameters/declare_function_output<T>():_T[]; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unnecessary-type-parameters": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare function output<T>(): T[];
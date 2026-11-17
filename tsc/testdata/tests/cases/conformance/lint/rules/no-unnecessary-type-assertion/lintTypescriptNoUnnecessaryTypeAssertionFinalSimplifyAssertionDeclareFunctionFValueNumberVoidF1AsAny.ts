// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyAssertion/declare_function_f(value:_number):_void;_f(1_as_any); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unnecessary-type-assertion": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare function f(value: number): void; f(1 as any);
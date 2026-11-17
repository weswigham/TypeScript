// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralDeprecated/function_f():_void;_/**_@deprecated_*/_function_f(x:_string):_void;_function_f(x?:_string)_{}_f();_f('x'); (invocation 1).
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
            "@typescript-eslint/no-deprecated": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
function f(): void; /** @deprecated */ function f(x: string): void; function f(x?: string) {} f(); f('x');
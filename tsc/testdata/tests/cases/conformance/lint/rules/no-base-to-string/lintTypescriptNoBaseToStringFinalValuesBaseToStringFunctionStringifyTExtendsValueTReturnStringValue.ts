// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesBaseToString/function_stringify<T_extends_{}>(value:_T)_{_return_String(value);_} (invocation 1).
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
            "@typescript-eslint/no-base-to-string": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
function stringify<T extends {}>(value: T) { return String(value); }
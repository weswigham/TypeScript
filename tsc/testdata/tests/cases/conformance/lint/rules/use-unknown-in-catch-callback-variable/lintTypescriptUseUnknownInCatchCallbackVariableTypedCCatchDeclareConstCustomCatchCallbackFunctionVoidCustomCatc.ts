// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCCatch/declare_const_custom:_{_catch(callback:_Function):_void_};_custom.catch(error_=>_{}); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/use-unknown-in-catch-callback-variable": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const custom: { catch(callback: Function): void }; custom.catch(error => {});
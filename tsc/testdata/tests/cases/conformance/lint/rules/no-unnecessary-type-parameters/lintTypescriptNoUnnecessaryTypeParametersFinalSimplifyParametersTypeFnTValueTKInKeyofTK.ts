// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyParameters/type_Fn_=_<T>(value:_T)_=>_{_[K_in_keyof_T]:_K_}; (invocation 1).
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
type Fn = <T>(value: T) => { [K in keyof T]: K };
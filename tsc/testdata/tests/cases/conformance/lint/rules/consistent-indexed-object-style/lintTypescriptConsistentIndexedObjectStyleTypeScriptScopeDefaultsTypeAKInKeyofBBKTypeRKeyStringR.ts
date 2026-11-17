// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/consistent-indexed-object-style/type_A_=_{_[K_in_keyof_B]:_B[K]_};_type_R_=_{_[key:_string]:_R_}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-indexed-object-style": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type A = { [K in keyof B]: B[K] }; type R = { [key: string]: R };
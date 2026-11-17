// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyParameters/declare_function_remap<T_extends_string>(value:_T):_{_[K_in_'a'_as_T]:_0_};_function_f<P_extends_string>(value:_P)_{_return_remap(value);_} (invocation 1).
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
declare function remap<T extends string>(value: T): { [K in 'a' as T]: 0 }; function f<P extends string>(value: P) { return remap(value); }
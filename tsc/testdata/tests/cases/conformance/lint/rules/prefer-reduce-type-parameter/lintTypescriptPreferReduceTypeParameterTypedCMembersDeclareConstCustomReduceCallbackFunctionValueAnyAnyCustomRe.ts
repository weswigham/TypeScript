// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCMembers/prefer-reduce-type-parameter/declare_const_custom:_{_reduce(callback:_Function,_value:_any):_any_};_custom.reduce(()_=>_{},_{}_as_any); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-reduce-type-parameter": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const custom: { reduce(callback: Function, value: any): any }; custom.reduce(() => {}, {} as any);
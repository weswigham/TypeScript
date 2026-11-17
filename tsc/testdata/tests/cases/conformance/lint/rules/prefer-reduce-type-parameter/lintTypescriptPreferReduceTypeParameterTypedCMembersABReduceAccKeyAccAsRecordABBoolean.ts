// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCMembers/prefer-reduce-type-parameter/['a',_'b'].reduce((acc,_key)_=>_acc,_{}_as_Record<'a'_|_'b',_boolean>); (invocation 1).
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
['a', 'b'].reduce((acc, key) => acc, {} as Record<'a' | 'b', boolean>);
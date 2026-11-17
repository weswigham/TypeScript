// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /project
// Migrated from TestTypedParityReturnAwaitSwitchResources/awaited_same_case (invocation 1).
// @filename: /project/tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/return-await": "error"
        }
    },
    "files": [
        "src/input.ts"
    ]
}
// @filename: /project/src/input.ts
async function f(k: number) { switch(k) { case 0: using r = null; return await Promise.resolve(1); } }
export {};
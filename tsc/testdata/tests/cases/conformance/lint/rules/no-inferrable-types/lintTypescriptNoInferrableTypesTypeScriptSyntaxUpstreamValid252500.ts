// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxUpstream/no-inferrable-types/valid/252/50/0 (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "react",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-inferrable-types": [
                "error",
                {
                    "ignoreParameters": true
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
const fn = function (a: number = 5, b: boolean = true, c: string = 'foo') {};
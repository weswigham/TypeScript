// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxUpstream/consistent-generic-constructors/valid/286/27/0 (invocation 1).
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
            "@typescript-eslint/consistent-generic-constructors": [
                "error",
                "type-annotation"
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
const a = new Foo();
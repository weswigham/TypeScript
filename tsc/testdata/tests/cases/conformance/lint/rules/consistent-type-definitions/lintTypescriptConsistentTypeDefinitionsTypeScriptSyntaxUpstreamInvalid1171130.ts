// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxUpstream/consistent-type-definitions/invalid/1171/13/0 (invocation 1).
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
            "@typescript-eslint/consistent-type-definitions": [
                "error",
                "type"
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts

declare global {
  interface Array<T> {
    foo(x: (x: number) => T): T[];
  }
}
      
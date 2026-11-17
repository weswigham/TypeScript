// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxUpstream/consistent-generic-constructors/invalid/4327/11/0 (invocation 1).
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
            "@typescript-eslint/consistent-generic-constructors": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts

class Foo {
  accessor a: Foo<string> = new Foo();
}
      
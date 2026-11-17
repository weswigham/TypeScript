// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxUpstream/no-empty-object-type/valid/254/1/0 (invocation 1).
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
            "@typescript-eslint/no-empty-object-type": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts

interface Base {
  name: string;
}

interface Derived {
  age: number;
}

// valid because extending multiple interfaces can be used instead of a union type
interface Both extends Base, Derived {}
    
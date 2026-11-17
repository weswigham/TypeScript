// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralUpstream/no-mixed-enums/valid/8 (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-mixed-enums": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts

const getValue = () => 0;
enum Fruit {
  Apple,
  Banana = getValue(),
}
    
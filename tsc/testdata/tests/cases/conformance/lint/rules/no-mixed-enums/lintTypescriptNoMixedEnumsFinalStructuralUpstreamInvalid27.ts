// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralUpstream/no-mixed-enums/invalid/27 (invocation 1).
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

enum Bar {
  A = 1,
}
namespace Bar {
  export const baz = 'baz';
}
enum Bar {
  B = 'B',
}
      
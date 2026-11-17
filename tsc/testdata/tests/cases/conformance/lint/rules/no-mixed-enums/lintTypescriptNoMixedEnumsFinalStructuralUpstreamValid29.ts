// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralUpstream/no-mixed-enums/valid/29 (invocation 1).
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

namespace Outer {
  namespace Test {
    export enum Bar {
      A = 1,
    }
  }
}
namespace Different {
  namespace Test {
    export enum Bar {
      B = 'B',
    }
  }
}
    
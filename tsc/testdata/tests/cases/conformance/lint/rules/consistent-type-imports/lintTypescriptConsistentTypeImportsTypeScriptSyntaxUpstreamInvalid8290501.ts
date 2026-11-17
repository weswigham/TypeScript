// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxUpstream/consistent-type-imports/invalid/8290/50/1 (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "emitDecoratorMetadata": true,
        "experimentalDecorators": false,
        "jsx": "react",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    "fixStyle": "inline-type-imports",
                    "prefer": "type-imports"
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts

import { A, B } from 'foo';
let foo: A;
let bar: B;
          
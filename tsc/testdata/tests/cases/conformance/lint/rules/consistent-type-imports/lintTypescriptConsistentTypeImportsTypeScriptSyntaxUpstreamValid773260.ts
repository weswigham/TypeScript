// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxUpstream/consistent-type-imports/valid/773/26/0 (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "emitDecoratorMetadata": false,
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

import { B } from 'foo';
import type { A } from 'foo';
type T = A;
const b = B;
          
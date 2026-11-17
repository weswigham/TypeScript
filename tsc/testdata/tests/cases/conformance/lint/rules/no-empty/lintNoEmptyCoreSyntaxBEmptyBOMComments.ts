// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoEmpty/empty_BOM_comments (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-empty": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (ready) {﻿/* intentional */﻿} switch (value) {﻿}
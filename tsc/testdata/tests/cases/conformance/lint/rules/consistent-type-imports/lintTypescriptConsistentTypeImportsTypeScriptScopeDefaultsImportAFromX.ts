// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/consistent-type-imports/import_{_A_}_from_'x'; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-type-imports": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
import { A } from 'x';
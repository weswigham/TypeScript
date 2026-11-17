// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/consistent-type-imports/import_{_A,_B_}_from_'x';_let_value:_A;_use(B); (invocation 1).
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
import { A, B } from 'x'; let value: A; use(B);
// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-require-imports/require('x');_import_x_=_require('x');_function_local(require)_{_require('x');_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-require-imports": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
require('x'); import x = require('x'); function local(require) { require('x'); }
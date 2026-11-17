// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeImportsRuntimeReferences/renamed_JSX_factory (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "react",
        "jsxFactory": "h",
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
        "/input.tsx"
    ]
}
// @filename: /input.tsx
import { factory as h } from 'x'; type FC = typeof h; const element = <div />;
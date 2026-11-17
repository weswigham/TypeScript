// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeImportsRuntimeReferences/JSX_fragment_factory (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "react",
        "jsxFragmentFactory": "Fragment",
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
import { Fragment } from 'x'; type F = Fragment; const element = <>text</>;
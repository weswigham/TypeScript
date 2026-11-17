// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeImportsRuntimeReferences/qualified_JSX_factory (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "react",
        "jsxFactory": "preact.h",
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
import preact from 'preact'; type FC = preact.FC; const element = <div />;
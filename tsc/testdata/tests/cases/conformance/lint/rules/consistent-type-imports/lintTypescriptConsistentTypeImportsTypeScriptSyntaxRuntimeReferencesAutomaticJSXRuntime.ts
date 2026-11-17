// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeImportsRuntimeReferences/automatic_JSX_runtime (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "react-jsx",
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
import React from 'react'; type FC = React.FC; const element = <div />;
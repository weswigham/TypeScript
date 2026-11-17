// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeImportsRuntimeReferences/automatic_JSX_file_pragma (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "react",
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
/** @jsxRuntime automatic */
import React from 'react'; type FC = React.FC; const element = <div />;
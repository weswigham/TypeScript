// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeImportsRuntimeReferences/metadata_no-type-imports_preference (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
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
                    "prefer": "no-type-imports"
                }
            ]
        }
    },
    "files": [
        "/input.tsx"
    ]
}
// @filename: /input.tsx
import type A from 'x'; type T = A; @decorate class C {}
// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesRestrictTemplateExpressionsOptionsAndRanges/template_custom_inherited (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/restrict-template-expressions": [
                "error",
                {
                    "allow": [
                        {
                            "from": "file",
                            "name": "Base"
                        }
                    ]
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
class Base {} class Derived extends Base {} `${new Derived()}`;
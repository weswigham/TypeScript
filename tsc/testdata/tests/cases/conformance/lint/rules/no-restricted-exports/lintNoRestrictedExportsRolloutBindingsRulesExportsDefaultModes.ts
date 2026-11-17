// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/exports_default_modes (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-restricted-exports": [
                "error",
                {
                    "restrictDefaultExports": {
                        "defaultFrom": true,
                        "named": true,
                        "namedFrom": true,
                        "namespaceFrom": true
                    }
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export {value as default}; export {default} from 'mod'; export {value as default} from 'mod'; export * as default from 'mod';
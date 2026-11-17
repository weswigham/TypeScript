// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/deny_imports (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "id-denylist": [
                "error",
                "bad"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
import {bad as good, good as bad} from 'mod'; export { bad as good }; export {bad as good} from 'mod';
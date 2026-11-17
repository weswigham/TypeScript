// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /project
// Migrated from TestTypedParityFileSpecifiers/prefer-readonly-parameter-types/unspecified_path (invocation 1).
// @filename: /project/tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-readonly-parameter-types": [
                "error",
                {
                    "allow": [
                        {
                            "from": "file",
                            "name": "Allowed"
                        }
                    ]
                }
            ]
        }
    },
    "files": [
        "src/input.ts"
    ]
}
// @filename: /project/types.ts
export interface Allowed { value: number; }
// @filename: /project/src/input.ts
import { Allowed } from '../types'; function f(value: Allowed) {}
export {};
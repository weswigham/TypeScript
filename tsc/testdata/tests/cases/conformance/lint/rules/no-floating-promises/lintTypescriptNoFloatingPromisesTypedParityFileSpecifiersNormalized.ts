// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /project
// Migrated from TestTypedParityFileSpecifiers/no-floating-promises/normalized (invocation 1).
// @filename: /project/tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-floating-promises": [
                "error",
                {
                    "allowForKnownSafePromises": [
                        {
                            "from": "file",
                            "name": "Allowed",
                            "path": "./src/../types.ts"
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
export type Allowed = Promise<void> & { brand: true };
// @filename: /project/src/input.ts
import { Allowed } from '../types'; declare const value: Allowed; value;
export {};
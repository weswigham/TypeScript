// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /project
// Migrated from TestTypedParityFileSpecifiers/only-throw-error/unspecified_outside (invocation 1).
// @filename: /project/tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/only-throw-error": [
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
// @filename: /outside/types.ts
export class Allowed { value = 0; }
// @filename: /project/src/input.ts
import { Allowed } from '../../outside/types'; throw new Allowed();
export {};
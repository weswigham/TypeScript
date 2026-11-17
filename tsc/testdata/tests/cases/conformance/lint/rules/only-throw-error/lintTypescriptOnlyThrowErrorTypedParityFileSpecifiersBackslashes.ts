// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /project
// Migrated from TestTypedParityFileSpecifiers/only-throw-error/backslashes (invocation 1).
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
                            "name": "Allowed",
                            "path": ".\\src\\..\\types.ts"
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
export class Allowed { value = 0; }
// @filename: /project/src/input.ts
import { Allowed } from '../types'; throw new Allowed();
export {};
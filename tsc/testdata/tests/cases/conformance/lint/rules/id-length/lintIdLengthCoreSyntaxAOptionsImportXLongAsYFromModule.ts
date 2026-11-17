// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/id-length/import_{_x,_long_as_y_}_from_'module'; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "id-length": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
import { x, long as y } from 'module';
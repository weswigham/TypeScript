// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixtures/no-undefined (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-undefined": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
let value = undefined;
function shadowed(undefined: number) {
    return undefined;
}
const object = { undefined: 0 };
object.undefined;
const shorthand = { undefined };
type Optional = number | undefined;
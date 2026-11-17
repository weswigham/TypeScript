// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixtures/no-undef-init (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-undef-init": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
var retainedForHoisting = undefined;
let removable = undefined;
let annotated: string | undefined = undefined;
let commented = /* retain */ undefined;
const requiredInitializer = undefined;
function shadowed(undefined: number) {
    let value = undefined;
}
let { destructured } = undefined;
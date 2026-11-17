// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipFixtures/prefer-readonly-parameter-types (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-readonly-parameter-types": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts

interface Cycle { readonly next: Cycle; }
interface MutableCycle { next: MutableCycle; }
interface Methods { run(): void; }
type Brand = string & { readonly tag: unique symbol };
function mutable(value: string[]) {}
function nested(value: readonly string[][]) {}
function shallow(value: Readonly<MutableCycle>) {}
function methods(value: Methods) {}
function recursive(value: Cycle) {}
function immutable(value: readonly [string, readonly number[]]) {}
function branded(value: Brand) {}
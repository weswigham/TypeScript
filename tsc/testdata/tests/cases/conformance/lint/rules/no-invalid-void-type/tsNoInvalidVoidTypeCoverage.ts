// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "target": "esnext",
        "module": "preserve"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-invalid-void-type": ["error", {
                "allowAsThisParameter": true
            }]
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
function invalidParameter(value: void): void {}
type InvalidUnion = void | number;

let pending: Promise<void>;
type MaybePending = void | Promise<void>;
function validReturn(): void {}
function validThis(this: void) {}
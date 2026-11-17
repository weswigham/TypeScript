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
            "@typescript-eslint/no-explicit-any": ["error", {
                "fixToUnknown": true,
                "ignoreRestArgs": true
            }]
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
let value: any;
let values: any[];
type Key = keyof any;

let safeValue: unknown;
let safeValues: unknown[];
function collect(...args: readonly any[]) {
    return args.length;
}
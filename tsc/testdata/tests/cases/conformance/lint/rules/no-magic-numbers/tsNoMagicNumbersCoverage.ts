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
            "@typescript-eslint/no-magic-numbers": ["error", {
                "ignore": [0],
                "ignoreNumericLiteralTypes": true
            }]
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
declare function consume(value: number): void;

enum MagicValues {
    Positive = +1,
    Negative = -2,
}
interface LiteralProperty {
    value: 1;
}
consume(7);

type AllowedLiteralTypes = 1 | -2;
const namedValue = 3;
consume(namedValue);
consume(0);
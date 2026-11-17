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
            "@typescript-eslint/no-deprecated": "error"
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
/** @deprecated */
const legacyValue = 1;
/** @deprecated Use currentValue. */
const oldValue = 2;
const currentValue = 3;

legacyValue;
oldValue;
currentValue;

/** @deprecated */
const unusedLegacyValue = 4;
const documentation = "/** @deprecated */";
documentation;
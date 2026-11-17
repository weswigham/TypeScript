// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "noImplicitThis": false,
        "target": "esnext",
        "module": "preserve"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-invalid-this": "error"
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
export {};

function invalidThis() {
    return this;
}

function explicitThis(this: object) {
    return this;
}
const receiver = {
    method() {
        return this;
    },
};
class Instance {
    self = this;
    method() {
        return this;
    }
}
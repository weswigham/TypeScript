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
            "@typescript-eslint/no-empty-function": ["error", {
                "allow": ["private-constructors", "protected-constructors"]
            }]
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
function emptyFunction() {}
const emptyArrow = () => {};
class EmptyMethod {
    run() {}
}

class PrivateConstructor {
    private constructor() {}
}
class ProtectedConstructor {
    protected constructor() {}
}
class ParameterProperty {
    constructor(public value: number) {}
}
function identity(value: number) {
    return value;
}
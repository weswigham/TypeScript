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
            "@typescript-eslint/no-misused-new": "error"
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
interface ConstructorConfusion {
    new(): ConstructorConfusion;
    constructor(): void;
}
declare class MethodConfusion {
    new(): MethodConfusion;
}

class ImplementedMethod {
    new(): ImplementedMethod {
        return this;
    }
}
interface Instance {
    value: number;
}
interface Factory {
    new(): Instance;
}
// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/parameter-properties": ["error", { "prefer": "class-property", "allow": ["private readonly"] }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
class ParameterProperty {
    constructor(public value: string) {}
}

class AllowedParameterProperty {
    constructor(private readonly value: string) {}
    read(): string {
        return this.value;
    }
}

class ClassProperty {
    value: string;
    constructor(value: string) {
        this.value = value;
    }
}
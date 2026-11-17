// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/no-useless-constructor": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
class Empty {
    constructor() {}
}

class PublicEmpty {
    public constructor() {}
}

class Base {
    constructor(value: number) {
        void value;
    }
}
class Forwarding extends Base {
    constructor(value: number) {
        super(value);
    }
}

class Restricted {
    private constructor() {}
}
class WithProperty {
    constructor(public value: number) {}
}
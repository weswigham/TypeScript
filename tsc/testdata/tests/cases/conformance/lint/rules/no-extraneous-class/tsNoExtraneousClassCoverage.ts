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
            "@typescript-eslint/no-extraneous-class": "error"
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
class Empty {}
class ConstructorOnly {
    constructor() {}
}
class StaticOnly {
    static value = 1;
}

class InstanceProperty {
    value = 1;
}
class ParameterProperty {
    constructor(public value: number) {}
}
class Derived extends InstanceProperty {}
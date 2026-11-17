// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "strict": true },
    "lint": {
        "rules": {
            "constructor-super": "error",
            "no-this-before-super": "error"
        }
    },
    "files": ["input.ts"]
}
// @filename: input.ts
declare class Base { value: number; }
declare const flag: boolean;
declare const error: Error;

class UnreachableSuper extends Base {
    constructor() { return { value: 0 }; super(); this.value; }
}
class Initialized extends Base {
    constructor() { super(); this.value; }
}
class MixedSuper extends Base {
    constructor() { if (flag) super(); super(); this.value; }
}
class ReturnedObject extends Base {
    constructor() { return { value: 0 }; }
}
class MixedObjectReturn extends Base {
    constructor() {
        try {
            if (flag) super();
            return { value: 0 };
        } finally {
            this.value;
        }
    }
}
class UnreachableReturn extends Base {
    constructor() { throw error; return { value: 0 }; }
}
class BeforeSuper extends Base {
    constructor() { this.value; super(); }
}

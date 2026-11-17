// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "lint": { "rules": { "constructor-super": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare class Base {}
declare const flag: boolean;
class Missing extends Base { constructor() {} }
class Conditional extends Base { constructor() { flag && super(); } }
class Duplicate extends Base { constructor() { super(); super(); } }
class Finalized extends Base { constructor() { try { return; } finally { super(); } } }
class Returned extends Base { constructor() { return {}; } }
class Loop extends Base { constructor() { do { super(); } while (flag); } }
//// [tests/cases/conformance/lint/rules/constructor-super/rolloutConstructorSuperFlow.ts] ////

//// [input.ts]
declare class Base {}
declare const flag: boolean;
class Missing extends Base { constructor() {} }
class Conditional extends Base { constructor() { flag && super(); } }
class Duplicate extends Base { constructor() { super(); super(); } }
class Finalized extends Base { constructor() { try { return; } finally { super(); } } }
class Returned extends Base { constructor() { return {}; } }
class Loop extends Base { constructor() { do { super(); } while (flag); } }

//// [input.ts]
declare class Base {}
declare const flag: boolean;
class Missing extends Base { constructor() {} }
class Conditional extends Base { constructor() { flag && super(); } }
class Duplicate extends Base { constructor() { super(); super(); } }
class Finalized extends Base { constructor() { try { return; } finally { super(); } } }
class Returned extends Base { constructor() { return {}; } }
class Loop extends Base { constructor() { do { super(); } while (flag); } }

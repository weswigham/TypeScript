//// [tests/cases/conformance/lint/rules/no-this-before-super/rolloutNoThisBeforeSuperFlow.ts] ////

//// [input.ts]
declare class Base { value: unknown; constructor(value?: unknown); }
declare const flag: boolean;
class Before extends Base { constructor() { this.value; super(); } }
class Argument extends Base { constructor() { super(this.value); } }
class Conditional extends Base { constructor() { flag && super(); this.value; } }
class Finally extends Base { constructor() { try { super(); } finally { this.value; } } }
class After extends Base { constructor() { super(); this.value; } }
class Deferred extends Base { constructor() { const later = () => this.value; super(); } }

//// [input.ts]
declare class Base { value: unknown; constructor(value?: unknown); }
declare const flag: boolean;
class Before extends Base { constructor() { this.value; super(); } }
class Argument extends Base { constructor() { super(this.value); } }
class Conditional extends Base { constructor() { flag && super(); this.value; } }
class Finally extends Base { constructor() { try { super(); } finally { this.value; } } }
class After extends Base { constructor() { super(); this.value; } }
class Deferred extends Base { constructor() { const later = () => this.value; super(); } }

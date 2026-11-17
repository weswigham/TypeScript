//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream99.ts] ////

//// [input.ts]
class A extends B { constructor() { var B = class extends C { constructor() { super(); this.d = 0; } }; super(); } }

//// [input.ts]
class A extends B { constructor() { var B = class extends C { constructor() { super(); this.d = 0; } }; super(); } }

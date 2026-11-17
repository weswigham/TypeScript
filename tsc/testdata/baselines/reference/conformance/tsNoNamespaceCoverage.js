//// [tests/cases/conformance/lint/rules/no-namespace/tsNoNamespaceCoverage.ts] ////

//// [input.ts]
namespace Outer.Inner {}
namespace Runtime {
    export const value = 1;
}

declare namespace Ambient {
    namespace Nested {
        interface Value {
            value: string;
        }
    }
}
declare module "coverage-external" {
    export const value: number;
}

//// [input.ts]
namespace Outer.Inner {}
namespace Runtime {
    export const value = 1;
}

declare namespace Ambient {
    namespace Nested {
        interface Value {
            value: string;
        }
    }
}
declare module "coverage-external" {
    export const value: number;
}

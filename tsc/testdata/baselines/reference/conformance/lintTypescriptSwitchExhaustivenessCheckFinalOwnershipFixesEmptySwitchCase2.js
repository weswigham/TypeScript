//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipFixesEmptySwitchCase2.ts] ////

//// [input.ts]
declare const value: boolean; switch (value) {
    case false: {
        throw new Error('Not implemented yet: false case');
    }
    case true: {
        throw new Error('Not implemented yet: true case');
    }
}

//// [input.ts]
declare const value: boolean; switch (value) {
    case false: {
        throw new Error('Not implemented yet: false case');
    }
    case true: {
        throw new Error('Not implemented yet: true case');
    }
}

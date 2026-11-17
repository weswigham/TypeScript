//// [tests/cases/conformance/lint/rules/no-inferrable-types/noInferrableTypes.ts] ////

//// [input.ts]
const count: number = -1;
let text: string = `value ${count}`;
const truth: boolean = !count;
const large: bigint = -BigInt(10);
const empty: null = null;
const missing: undefined = void count;
const token: symbol = Symbol?.("token");
const pattern: RegExp = new RegExp("pattern");
const nan: number = NaN;
const optionalCall: number = Number?.("1");
const parenthesized: (number) = (1);
const retained: any = 1;
const literal: 1 = 1;
const noInitializer: number;
function defaults(value?: number = 1, flag: boolean = false) {}
const arrow = (value: string = "value") => value;
class Properties {
    readonly keep: number = 1;
    optional?: number = 1;
    definite!: number = 1;
    accessor value: number = 1;
    constructor(public parameter: boolean = true) {}
}

//// [input.ts]
const count = -1;
let text = `value ${count}`;
const truth = !count;
const large = -BigInt(10);
const empty = null;
const missing = void count;
const token = Symbol?.("token");
const pattern = new RegExp("pattern");
const nan = NaN;
const optionalCall = Number?.("1");
const parenthesized = (1);
const retained: any = 1;
const literal: 1 = 1;
const noInitializer: number;
function defaults(value = 1, flag = false) {}
const arrow = (value = "value") => value;
class Properties {
    readonly keep: number = 1;
    optional?: number = 1;
    definite = 1;
    accessor value = 1;
    constructor(public parameter = true) {}
}

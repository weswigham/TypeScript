//// [tests/cases/conformance/lint/rules/no-floating-promises/fileTypeSpecifierProjectDirectory.ts] ////

//// [types.ts]
export type SafePromise = Promise<void> & { brand: true };
export class AllowedError { value = 0; }
export interface AllowedParameter { value: number; }
export type AllowedString = string & { brand: true };
//// [types.ts]
export type SafePromise = Promise<void> & { brand: true };
export class AllowedError { value = 0; }
export interface AllowedParameter { value: number; }
export type AllowedString = string & { brand: true };
//// [input.ts]
import { SafePromise, AllowedError, AllowedParameter, AllowedString } from "../types";
import {
    SafePromise as OtherPromise,
    AllowedError as OtherError,
    AllowedParameter as OtherParameter,
    AllowedString as OtherString,
} from "../../outside/types";

declare const safePromise: SafePromise;
declare const otherPromise: OtherPromise;
safePromise;
otherPromise;

function throwAllowed() { throw new AllowedError(); }
function throwOther() { throw new OtherError(); }

function acceptParameters(allowed: AllowedParameter, other: OtherParameter) {}

declare const allowedString: AllowedString;
declare const otherString: OtherString;
const allowedSpread = [...allowedString];
const otherSpread = [...otherString];


//// [types.ts]
export type SafePromise = Promise<void> & { brand: true };
export class AllowedError { value = 0; }
export interface AllowedParameter { value: number; }
export type AllowedString = string & { brand: true };
//// [input.ts]
import { SafePromise, AllowedError, AllowedParameter, AllowedString } from "../types";
import {
    SafePromise as OtherPromise,
    AllowedError as OtherError,
    AllowedParameter as OtherParameter,
    AllowedString as OtherString,
} from "../../outside/types";

declare const safePromise: SafePromise;
declare const otherPromise: OtherPromise;
safePromise;
otherPromise;

function throwAllowed() { throw new AllowedError(); }
function throwOther() { throw new OtherError(); }

function acceptParameters(allowed: AllowedParameter, other: OtherParameter) {}

declare const allowedString: AllowedString;
declare const otherString: OtherString;
const allowedSpread = [...allowedString];
const otherSpread = [...otherString];
//// [types.ts]
export type SafePromise = Promise<void> & { brand: true };
export class AllowedError { value = 0; }
export interface AllowedParameter { value: number; }
export type AllowedString = string & { brand: true };

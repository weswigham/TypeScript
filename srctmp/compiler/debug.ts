import * as ts from "./ts";
/* @internal */
export namespace Debug {
    /* eslint-disable prefer-const */
    export let currentAssertionLevel = ts.AssertionLevel.None;
    export let isDebugging = false;
    /* eslint-enable prefer-const */
    export function shouldAssert(level: ts.AssertionLevel): boolean {
        return currentAssertionLevel >= level;
    }
    export function assert(expression: boolean, message?: string, verboseDebugInfo?: string | (() => string), stackCrawlMark?: ts.AnyFunction): void {
        if (!expression) {
            if (verboseDebugInfo) {
                message += "\r\nVerbose Debug Information: " + (typeof verboseDebugInfo === "string" ? verboseDebugInfo : verboseDebugInfo());
            }
            fail(message ? "False expression: " + message : "False expression.", stackCrawlMark || assert);
        }
    }
    export function assertEqual<T>(a: T, b: T, msg?: string, msg2?: string): void {
        if (a !== b) {
            const message = msg ? msg2 ? `${msg} ${msg2}` : msg : "";
            fail(`Expected ${a} === ${b}. ${message}`);
        }
    }
    export function assertLessThan(a: number, b: number, msg?: string): void {
        if (a >= b) {
            fail(`Expected ${a} < ${b}. ${msg || ""}`);
        }
    }
    export function assertLessThanOrEqual(a: number, b: number): void {
        if (a > b) {
            fail(`Expected ${a} <= ${b}`);
        }
    }
    export function assertGreaterThanOrEqual(a: number, b: number): void {
        if (a < b) {
            fail(`Expected ${a} >= ${b}`);
        }
    }
    export function fail(message?: string, stackCrawlMark?: ts.AnyFunction): never {
        debugger;
        const e = new Error(message ? `Debug Failure. ${message}` : "Debug Failure.");
        if ((<any>Error).captureStackTrace) {
            (<any>Error).captureStackTrace(e, stackCrawlMark || fail);
        }
        throw e;
    }
    export function assertDefined<T>(value: T | null | undefined, message?: string): T {
        // eslint-disable-next-line no-null/no-null
        if (value === undefined || value === null)
            return fail(message);
        return value;
    }
    export function assertEachDefined<T, A extends readonly T[]>(value: A, message?: string): A {
        for (const v of value) {
            assertDefined(v, message);
        }
        return value;
    }
    export function assertNever(member: never, message = "Illegal value:", stackCrawlMark?: ts.AnyFunction): never {
        const detail = typeof member === "object" && ts.hasProperty(member, "kind") && ts.hasProperty(member, "pos") && formatSyntaxKind ? "SyntaxKind: " + formatSyntaxKind((member as ts.Node).kind) : JSON.stringify(member);
        return fail(`${message} ${detail}`, stackCrawlMark || assertNever);
    }
    export function getFunctionName(func: ts.AnyFunction) {
        if (typeof func !== "function") {
            return "";
        }
        else if (func.hasOwnProperty("name")) {
            return (<any>func).name;
        }
        else {
            const text = Function.prototype.toString.call(func);
            const match = /^function\s+([\w\$]+)\s*\(/.exec(text);
            return match ? match[1] : "";
        }
    }
    export function formatSymbol(symbol: ts.Symbol): string {
        return `{ name: ${ts.unescapeLeadingUnderscores(symbol.escapedName)}; flags: ${formatSymbolFlags(symbol.flags)}; declarations: ${ts.map(symbol.declarations, node => formatSyntaxKind(node.kind))} }`;
    }
    /**
     * Formats an enum value as a string for debugging and debug assertions.
     */
    export function formatEnum(value = 0, enumObject: any, isFlags?: boolean) {
        const members = getEnumMembers(enumObject);
        if (value === 0) {
            return members.length > 0 && members[0][0] === 0 ? members[0][1] : "0";
        }
        if (isFlags) {
            let result = "";
            let remainingFlags = value;
            for (const [enumValue, enumName] of members) {
                if (enumValue > value) {
                    break;
                }
                if (enumValue !== 0 && enumValue & value) {
                    result = `${result}${result ? "|" : ""}${enumName}`;
                    remainingFlags &= ~enumValue;
                }
            }
            if (remainingFlags === 0) {
                return result;
            }
        }
        else {
            for (const [enumValue, enumName] of members) {
                if (enumValue === value) {
                    return enumName;
                }
            }
        }
        return value.toString();
    }
    function getEnumMembers(enumObject: any) {
        const result: [number, string][] = [];
        for (const name in enumObject) {
            const value = enumObject[name];
            if (typeof value === "number") {
                result.push([value, name]);
            }
        }
        return ts.stableSort<[number, string]>(result, (x, y) => ts.compareValues(x[0], y[0]));
    }
    export function formatSyntaxKind(kind: ts.SyntaxKind | undefined): string {
        return formatEnum(kind, (<any>ts).SyntaxKind, /*isFlags*/ false);
    }
    export function formatNodeFlags(flags: ts.NodeFlags | undefined): string {
        return formatEnum(flags, (<any>ts).NodeFlags, /*isFlags*/ true);
    }
    export function formatModifierFlags(flags: ts.ModifierFlags | undefined): string {
        return formatEnum(flags, (<any>ts).ModifierFlags, /*isFlags*/ true);
    }
    export function formatTransformFlags(flags: ts.TransformFlags | undefined): string {
        return formatEnum(flags, (<any>ts).TransformFlags, /*isFlags*/ true);
    }
    export function formatEmitFlags(flags: ts.EmitFlags | undefined): string {
        return formatEnum(flags, (<any>ts).EmitFlags, /*isFlags*/ true);
    }
    export function formatSymbolFlags(flags: ts.SymbolFlags | undefined): string {
        return formatEnum(flags, (<any>ts).SymbolFlags, /*isFlags*/ true);
    }
    export function formatTypeFlags(flags: ts.TypeFlags | undefined): string {
        return formatEnum(flags, (<any>ts).TypeFlags, /*isFlags*/ true);
    }
    export function formatObjectFlags(flags: ts.ObjectFlags | undefined): string {
        return formatEnum(flags, (<any>ts).ObjectFlags, /*isFlags*/ true);
    }
    export function failBadSyntaxKind(node: ts.Node, message?: string): never {
        return fail(`${message || "Unexpected node."}\r\nNode ${formatSyntaxKind(node.kind)} was unexpected.`, failBadSyntaxKind);
    }
    export const assertEachNode = shouldAssert(ts.AssertionLevel.Normal)
        ? (nodes: ts.Node[], test: (node: ts.Node) => boolean, message?: string): void => assert(test === undefined || ts.every(nodes, test), message || "Unexpected node.", () => `Node array did not pass test '${getFunctionName(test)}'.`, assertEachNode)
        : ts.noop;
    export const assertNode = shouldAssert(ts.AssertionLevel.Normal)
        ? (node: ts.Node | undefined, test: ((node: ts.Node | undefined) => boolean) | undefined, message?: string): void => assert(test === undefined || test(node), message || "Unexpected node.", () => `Node ${formatSyntaxKind(node!.kind)} did not pass test '${getFunctionName(test!)}'.`, assertNode)
        : ts.noop;
    export const assertNotNode = shouldAssert(ts.AssertionLevel.Normal)
        ? (node: ts.Node | undefined, test: ((node: ts.Node | undefined) => boolean) | undefined, message?: string): void => assert(test === undefined || !test(node), message || "Unexpected node.", () => `Node ${formatSyntaxKind(node!.kind)} should not have passed test '${getFunctionName(test!)}'.`, assertNode)
        : ts.noop;
    export const assertOptionalNode = shouldAssert(ts.AssertionLevel.Normal)
        ? (node: ts.Node, test: (node: ts.Node) => boolean, message?: string): void => assert(test === undefined || node === undefined || test(node), message || "Unexpected node.", () => `Node ${formatSyntaxKind(node.kind)} did not pass test '${getFunctionName(test)}'.`, assertOptionalNode)
        : ts.noop;
    export const assertOptionalToken = shouldAssert(ts.AssertionLevel.Normal)
        ? (node: ts.Node, kind: ts.SyntaxKind, message?: string): void => assert(kind === undefined || node === undefined || node.kind === kind, message || "Unexpected node.", () => `Node ${formatSyntaxKind(node.kind)} was not a '${formatSyntaxKind(kind)}' token.`, assertOptionalToken)
        : ts.noop;
    export const assertMissingNode = shouldAssert(ts.AssertionLevel.Normal)
        ? (node: ts.Node, message?: string): void => assert(node === undefined, message || "Unexpected node.", () => `Node ${formatSyntaxKind(node.kind)} was unexpected'.`, assertMissingNode)
        : ts.noop;
    let isDebugInfoEnabled = false;
    interface ExtendedDebugModule {
        init(_ts: typeof ts): void;
        formatControlFlowGraph(flowNode: ts.FlowNode): string;
    }
    let extendedDebugModule: ExtendedDebugModule | undefined;
    function extendedDebug() {
        enableDebugInfo();
        if (!extendedDebugModule) {
            throw new Error("Debugging helpers could not be loaded.");
        }
        return extendedDebugModule;
    }
    export function printControlFlowGraph(flowNode: ts.FlowNode) {
        return console.log(formatControlFlowGraph(flowNode));
    }
    export function formatControlFlowGraph(flowNode: ts.FlowNode) {
        return extendedDebug().formatControlFlowGraph(flowNode);
    }
    export function attachFlowNodeDebugInfo(flowNode: ts.FlowNode) {
        if (isDebugInfoEnabled) {
            if (!("__debugFlowFlags" in flowNode)) { // eslint-disable-line no-in-operator
                Object.defineProperties(flowNode, {
                    __debugFlowFlags: { get(this: ts.FlowNode) { return formatEnum(this.flags, (ts as any).FlowFlags, /*isFlags*/ true); } },
                    __debugToString: { value(this: ts.FlowNode) { return formatControlFlowGraph(this); } }
                });
            }
        }
    }
    /**
     * Injects debug information into frequently used types.
     */
    export function enableDebugInfo() {
        if (isDebugInfoEnabled)
            return;
        // Add additional properties in debug mode to assist with debugging.
        Object.defineProperties(ts.objectAllocator.getSymbolConstructor().prototype, {
            __debugFlags: { get(this: ts.Symbol) { return formatSymbolFlags(this.flags); } }
        });
        Object.defineProperties(ts.objectAllocator.getTypeConstructor().prototype, {
            __debugFlags: { get(this: ts.Type) { return formatTypeFlags(this.flags); } },
            __debugObjectFlags: { get(this: ts.Type) { return this.flags & ts.TypeFlags.Object ? formatObjectFlags((<ts.ObjectType>this).objectFlags) : ""; } },
            __debugTypeToString: { value(this: ts.Type) { return this.checker.typeToString(this); } },
        });
        const nodeConstructors = [
            ts.objectAllocator.getNodeConstructor(),
            ts.objectAllocator.getIdentifierConstructor(),
            ts.objectAllocator.getTokenConstructor(),
            ts.objectAllocator.getSourceFileConstructor()
        ];
        for (const ctor of nodeConstructors) {
            if (!ctor.prototype.hasOwnProperty("__debugKind")) {
                Object.defineProperties(ctor.prototype, {
                    __debugKind: { get(this: ts.Node) { return formatSyntaxKind(this.kind); } },
                    __debugNodeFlags: { get(this: ts.Node) { return formatNodeFlags(this.flags); } },
                    __debugModifierFlags: { get(this: ts.Node) { return formatModifierFlags(ts.getModifierFlagsNoCache(this)); } },
                    __debugTransformFlags: { get(this: ts.Node) { return formatTransformFlags(this.transformFlags); } },
                    __debugIsParseTreeNode: { get(this: ts.Node) { return ts.isParseTreeNode(this); } },
                    __debugEmitFlags: { get(this: ts.Node) { return formatEmitFlags(ts.getEmitFlags(this)); } },
                    __debugGetText: {
                        value(this: ts.Node, includeTrivia?: boolean) {
                            if (ts.nodeIsSynthesized(this))
                                return "";
                            const parseNode = ts.getParseTreeNode(this);
                            const sourceFile = parseNode && ts.getSourceFileOfNode(parseNode);
                            return sourceFile ? ts.getSourceTextOfNodeFromSourceFile(sourceFile, parseNode, includeTrivia) : "";
                        }
                    }
                });
            }
        }
        // attempt to load extended debugging information
        try {
            if (ts.sys && ts.sys.require) {
                const basePath = ts.getDirectoryPath(ts.resolvePath(ts.sys.getExecutingFilePath()));
                const result = (ts.sys.require(basePath, "./compiler-debug") as ts.RequireResult<ExtendedDebugModule>);
                if (!result.error) {
                    result.module.init(ts);
                    extendedDebugModule = result.module;
                }
            }
        }
        catch {
            // do nothing
        }
        isDebugInfoEnabled = true;
    }
}

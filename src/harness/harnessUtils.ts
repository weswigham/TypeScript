import { sys, AnyFunction, createMap, createGetCanonicalFileName, Node, forEachChild, Diagnostic, flattenDiagnosticMessageText, diagnosticCategoryName, isString, forEach, containsParseError, SourceFile, Identifier, NodeFlags, SyntaxKind, NodeArray } from "./ts";
import { IO, userSpecifiedRoot } from "./Harness";
import * as ts from "./ts";
export function encodeString(s: string): string {
    return sys.bufferFrom!(s).toString("utf8");
}
export function byteLength(s: string, encoding?: string): number {
    // stub implementation if Buffer is not available (in-browser case)
    return Buffer.byteLength(s, encoding as ts.BufferEncoding | undefined);
}
export function evalFile(fileContents: string, fileName: string, nodeContext?: any) {
    const vm = require("vm");
    if (nodeContext) {
        vm.runInNewContext(fileContents, nodeContext, fileName);
    }
    else {
        vm.runInThisContext(fileContents, fileName);
    }
}
/** Splits the given string on \r\n, or on only \n if that fails, or on only \r if *that* fails. */
export function splitContentByNewlines(content: string) {
    // Split up the input file by line
    // Note: IE JS engine incorrectly handles consecutive delimiters here when using RegExp split, so
    // we have to use string-based splitting instead and try to figure out the delimiting chars
    let lines = content.split("\r\n");
    if (lines.length === 1) {
        lines = content.split("\n");
        if (lines.length === 1) {
            lines = content.split("\r");
        }
    }
    return lines;
}
/** Reads a file under /tests */
export function readTestFile(path: string) {
    if (path.indexOf("tests") < 0) {
        path = "tests/" + path;
    }
    let content: string | undefined;
    try {
        content = IO.readFile(userSpecifiedRoot + path);
    }
    catch (err) {
        return undefined;
    }
    return content;
}
export function memoize<T extends AnyFunction>(f: T, memoKey: (...anything: any[]) => string): T {
    const cache = createMap<any>();
    return <any>(function (this: any, ...args: any[]) {
        const key = memoKey(...args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        else {
            const value = f.apply(this, args);
            cache.set(key, value);
            return value;
        }
    });
}
export const canonicalizeForHarness = createGetCanonicalFileName(/*caseSensitive*/ false); // This is done so tests work on windows _and_ linux
export function assertInvariants(node: Node | undefined, parent: Node | undefined) {
    const queue: [Node | undefined, Node | undefined][] = [[node, parent]];
    for (const [node, parent] of queue) {
        assertInvariantsWorker(node, parent);
    }
    function assertInvariantsWorker(node: Node | undefined, parent: Node | undefined): void {
        if (node) {
            assert.isFalse(node.pos < 0, "node.pos < 0");
            assert.isFalse(node.end < 0, "node.end < 0");
            assert.isFalse(node.end < node.pos, "node.end < node.pos");
            assert.equal(node.parent, parent, "node.parent !== parent");
            if (parent) {
                // Make sure each child is contained within the parent.
                assert.isFalse(node.pos < parent.pos, "node.pos < parent.pos");
                assert.isFalse(node.end > parent.end, "node.end > parent.end");
            }
            forEachChild(node, child => {
                queue.push([child, node]);
            });
            // Make sure each of the children is in order.
            let currentPos = 0;
            forEachChild(node, child => {
                assert.isFalse(child.pos < currentPos, "child.pos < currentPos");
                currentPos = child.end;
            }, array => {
                assert.isFalse(array.pos < node.pos, "array.pos < node.pos");
                assert.isFalse(array.end > node.end, "array.end > node.end");
                assert.isFalse(array.pos < currentPos, "array.pos < currentPos");
                for (const item of array) {
                    assert.isFalse(item.pos < currentPos, "array[i].pos < currentPos");
                    currentPos = item.end;
                }
                currentPos = array.end;
            });
            const childNodesAndArrays: any[] = [];
            forEachChild(node, child => { childNodesAndArrays.push(child); }, array => { childNodesAndArrays.push(array); });
            for (const childName in node) {
                if (childName === "parent" || childName === "nextContainer" || childName === "modifiers" || childName === "externalModuleIndicator" ||
                    // for now ignore jsdoc comments
                    childName === "jsDocComment" || childName === "checkJsDirective" || childName === "commonJsModuleIndicator") {
                    continue;
                }
                const child = (<any>node)[childName];
                if (isNodeOrArray(child)) {
                    assert.isFalse(childNodesAndArrays.indexOf(child) < 0, "Missing child when forEach'ing over node: " + (<any>ts).SyntaxKind[node.kind] + "-" + childName);
                }
            }
        }
    }
}
function isNodeOrArray(a: any): boolean {
    return a !== undefined && typeof a.pos === "number";
}
export function convertDiagnostics(diagnostics: readonly Diagnostic[]) {
    return diagnostics.map(convertDiagnostic);
}
function convertDiagnostic(diagnostic: Diagnostic) {
    return {
        start: diagnostic.start,
        length: diagnostic.length,
        messageText: flattenDiagnosticMessageText(diagnostic.messageText, IO.newLine()),
        category: diagnosticCategoryName(diagnostic, /*lowerCase*/ false),
        code: diagnostic.code
    };
}
export function sourceFileToJSON(file: Node): string {
    return JSON.stringify(file, (_, v) => isNodeOrArray(v) ? serializeNode(v) : v, "    ");
    function getKindName(k: number | string): string {
        if (isString(k)) {
            return k;
        }
        // For some markers in SyntaxKind, we should print its original syntax name instead of
        // the marker name in tests.
        if (k === (<any>ts).SyntaxKind.FirstJSDocNode ||
            k === (<any>ts).SyntaxKind.LastJSDocNode ||
            k === (<any>ts).SyntaxKind.FirstJSDocTagNode ||
            k === (<any>ts).SyntaxKind.LastJSDocTagNode) {
            for (const kindName in (<any>ts).SyntaxKind) {
                if ((<any>ts).SyntaxKind[kindName] === k) {
                    return kindName;
                }
            }
        }
        return (<any>ts).SyntaxKind[k];
    }
    function getFlagName(flags: any, f: number): any {
        if (f === 0) {
            return 0;
        }
        let result = "";
        forEach(Object.getOwnPropertyNames(flags), (v: any) => {
            if (isFinite(v)) {
                v = +v;
                if (f === +v) {
                    result = flags[v];
                    return true;
                }
                else if ((f & v) > 0) {
                    if (result.length) {
                        result += " | ";
                    }
                    result += flags[v];
                    return false;
                }
            }
        });
        return result;
    }
    function getNodeFlagName(f: number) { return getFlagName((<any>ts).NodeFlags, f); }
    function serializeNode(n: Node): any {
        const o: any = { kind: getKindName(n.kind) };
        if (containsParseError(n)) {
            o.containsParseError = true;
        }
        for (const propertyName of Object.getOwnPropertyNames(n) as readonly (keyof SourceFile | keyof Identifier)[]) {
            switch (propertyName) {
                case "parent":
                case "symbol":
                case "locals":
                case "localSymbol":
                case "kind":
                case "id":
                case "nodeCount":
                case "symbolCount":
                case "identifierCount":
                case "scriptSnapshot":
                    // Blacklist of items we never put in the baseline file.
                    break;
                case "originalKeywordKind":
                    o[propertyName] = getKindName((<any>n)[propertyName]);
                    break;
                case "flags":
                    // Clear the flags that are produced by aggregating child values. That is ephemeral
                    // data we don't care about in the dump. We only care what the parser set directly
                    // on the AST.
                    const flags = n.flags & ~(NodeFlags.JavaScriptFile | NodeFlags.HasAggregatedChildData);
                    if (flags) {
                        o[propertyName] = getNodeFlagName(flags);
                    }
                    break;
                case "parseDiagnostics":
                    o[propertyName] = convertDiagnostics((<any>n)[propertyName]);
                    break;
                case "nextContainer":
                    if (n.nextContainer) {
                        o[propertyName] = { kind: n.nextContainer.kind, pos: n.nextContainer.pos, end: n.nextContainer.end };
                    }
                    break;
                case "text":
                    // Include 'text' field for identifiers/literals, but not for source files.
                    if (n.kind !== SyntaxKind.SourceFile) {
                        o[propertyName] = (<any>n)[propertyName];
                    }
                    break;
                default:
                    o[propertyName] = (<any>n)[propertyName];
            }
        }
        return o;
    }
}
export function assertDiagnosticsEquals(array1: readonly Diagnostic[], array2: readonly Diagnostic[]) {
    if (array1 === array2) {
        return;
    }
    assert(array1, "array1");
    assert(array2, "array2");
    assert.equal(array1.length, array2.length, "array1.length !== array2.length");
    for (let i = 0; i < array1.length; i++) {
        const d1 = array1[i];
        const d2 = array2[i];
        assert.equal(d1.start, d2.start, "d1.start !== d2.start");
        assert.equal(d1.length, d2.length, "d1.length !== d2.length");
        assert.equal(flattenDiagnosticMessageText(d1.messageText, IO.newLine()), flattenDiagnosticMessageText(d2.messageText, IO.newLine()), "d1.messageText !== d2.messageText");
        assert.equal(d1.category, d2.category, "d1.category !== d2.category");
        assert.equal(d1.code, d2.code, "d1.code !== d2.code");
    }
}
export function assertStructuralEquals(node1: Node, node2: Node) {
    if (node1 === node2) {
        return;
    }
    assert(node1, "node1");
    assert(node2, "node2");
    assert.equal(node1.pos, node2.pos, "node1.pos !== node2.pos");
    assert.equal(node1.end, node2.end, "node1.end !== node2.end");
    assert.equal(node1.kind, node2.kind, "node1.kind !== node2.kind");
    // call this on both nodes to ensure all propagated flags have been set (and thus can be
    // compared).
    assert.equal(containsParseError(node1), containsParseError(node2));
    assert.equal(node1.flags & ~NodeFlags.ReachabilityAndEmitFlags, node2.flags & ~NodeFlags.ReachabilityAndEmitFlags, "node1.flags !== node2.flags");
    forEachChild(node1, child1 => {
        const childName = findChildName(node1, child1);
        const child2: Node = (<any>node2)[childName];
        assertStructuralEquals(child1, child2);
    }, array1 => {
        const childName = findChildName(node1, array1);
        const array2: NodeArray<Node> = (<any>node2)[childName];
        assertArrayStructuralEquals(array1, array2);
    });
}
function assertArrayStructuralEquals(array1: NodeArray<Node>, array2: NodeArray<Node>) {
    if (array1 === array2) {
        return;
    }
    assert(array1, "array1");
    assert(array2, "array2");
    assert.equal(array1.pos, array2.pos, "array1.pos !== array2.pos");
    assert.equal(array1.end, array2.end, "array1.end !== array2.end");
    assert.equal(array1.length, array2.length, "array1.length !== array2.length");
    for (let i = 0; i < array1.length; i++) {
        assertStructuralEquals(array1[i], array2[i]);
    }
}
function findChildName(parent: any, child: any) {
    for (const name in parent) {
        if (parent.hasOwnProperty(name) && parent[name] === child) {
            return name;
        }
    }
    throw new Error("Could not find child in parent");
}
const maxHarnessFrames = 1;
export function filterStack(error: Error, stackTraceLimit = Infinity) {
    const stack = <string>(<any>error).stack;
    if (stack) {
        const lines = stack.split(/\r\n?|\n/g);
        const filtered: string[] = [];
        let frameCount = 0;
        let harnessFrameCount = 0;
        for (let line of lines) {
            if (isStackFrame(line)) {
                if (frameCount >= stackTraceLimit
                    || isMocha(line)
                    || isNode(line)) {
                    continue;
                }
                if (isHarness(line)) {
                    if (harnessFrameCount >= maxHarnessFrames) {
                        continue;
                    }
                    harnessFrameCount++;
                }
                line = line.replace(/\bfile:\/\/\/(.*?)(?=(:\d+)*($|\)))/, (_, path) => sys.resolvePath(path));
                frameCount++;
            }
            filtered.push(line);
        }
        (<any>error).stack = filtered.join(IO.newLine());
    }
    return error;
}
function isStackFrame(line: string) {
    return /^\s+at\s/.test(line);
}
function isMocha(line: string) {
    return /[\\/](node_modules|components)[\\/]mocha(js)?[\\/]|[\\/]mocha\.js/.test(line);
}
function isNode(line: string) {
    return /\((timers|events|node|module)\.js:/.test(line);
}
function isHarness(line: string) {
    return /[\\/]src[\\/]harness[\\/]|[\\/]run\.js/.test(line);
}

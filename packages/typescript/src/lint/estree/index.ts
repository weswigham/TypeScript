import type { TSESTree } from "@typescript-eslint/types";
import { visitorKeys } from "@typescript-eslint/visitor-keys";
import type {
    Node,
    SourceFile,
} from "../../ast/index.ts";
import { Converter } from "./converter.ts";

export interface ConvertedSourceFile {
    ast: TSESTree.Program;
    visitorKeys: typeof visitorKeys;
    esTreeNodeToTSNodeMap: WeakMap<TSESTree.Node, Node>;
    tsNodeToESTreeNodeMap: WeakMap<Node, TSESTree.Node>;
}

/**
 * Converts a locally decoded native AST once for all JavaScript lint rules.
 * The native AST and its identities are retained; no parser or compiler connection is used.
 * stripBOM creates ESLint SourceCode coordinates while retaining native node positions.
 */
export function convertSourceFile(sourceFile: SourceFile, stripBOM = false): ConvertedSourceFile {
    const converter = new Converter(sourceFile, stripBOM);
    return {
        ast: converter.program(),
        visitorKeys,
        esTreeNodeToTSNodeMap: converter.esTreeNodeToTSNodeMap,
        tsNodeToESTreeNodeMap: converter.tsNodeToESTreeNodeMap,
    };
}

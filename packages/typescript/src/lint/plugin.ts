import type {
    Scope as TSScope,
    ScopeManager,
    Variable as TSVariable,
} from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/types";
import type {
    Linter,
    Rule,
} from "eslint";
import type {
    API,
    Checker,
    Program,
    Project,
    Snapshot,
    Symbol as NativeSymbol,
    Type,
} from "../api/sync/api.ts";
import type { Node as NativeNode } from "../ast/index.ts";
import type { NativeAPIContext } from "./types.ts";

export type { TSESTree as ESTree } from "@typescript-eslint/types";
export type { NativeAPIContext } from "./types.ts";
export type Node = TSESTree.Node;
export type Token = TSESTree.Token;
export type Comment = TSESTree.Comment;
export type Location = TSESTree.SourceLocation;
export type LineColumn = TSESTree.Position;
export type Scope = TSScope;
export type Variable = TSVariable;
export type Fix = Rule.Fix;
export type RuleMeta = Rule.RuleMetaData;

export interface Fixer {
    insertTextAfter(node: Node | Token | Comment, text: string): Fix;
    insertTextAfterRange(range: [number, number], text: string): Fix;
    insertTextBefore(node: Node | Token | Comment, text: string): Fix;
    insertTextBeforeRange(range: [number, number], text: string): Fix;
    remove(node: Node | Token | Comment): Fix;
    removeRange(range: [number, number]): Fix;
    replaceText(node: Node | Token | Comment, text: string): Fix;
    replaceTextRange(range: [number, number], text: string): Fix;
}

export interface TokenOptions {
    includeComments?: boolean | undefined;
    skip?: number | undefined;
    count?: number | undefined;
    filter?: ((token: Token | Comment) => boolean) | undefined;
}

type PlainTokenOptions = Omit<TokenOptions, "includeComments" | "filter"> & {
    includeComments?: false | undefined;
    filter?: ((token: Token) => boolean) | undefined;
};
type PlainCursorOptions = number | PlainTokenOptions | ((token: Token) => boolean);
type SyntaxElement = Node | Token | Comment;

export interface TokenCursor {
    (node: SyntaxElement, options?: PlainCursorOptions | undefined): Token | null;
    (node: SyntaxElement, options: TokenOptions): Token | Comment | null;
}

export interface TokensCursor {
    (node: SyntaxElement, options?: PlainCursorOptions | undefined): Token[];
    (node: SyntaxElement, options: TokenOptions): (Token | Comment)[];
}

export interface BetweenTokenCursor {
    (left: SyntaxElement, right: SyntaxElement, options?: PlainCursorOptions | undefined): Token | null;
    (left: SyntaxElement, right: SyntaxElement, options: TokenOptions): Token | Comment | null;
}

export interface BetweenTokensCursor {
    (left: SyntaxElement, right: SyntaxElement, options?: PlainCursorOptions | undefined): Token[];
    (left: SyntaxElement, right: SyntaxElement, options: TokenOptions): (Token | Comment)[];
}

export interface ParserServices {
    readonly esTreeNodeToTSNodeMap: WeakMap<Node, NativeNode>;
    readonly tsNodeToESTreeNodeMap: WeakMap<NativeNode, Node>;
    readonly hasFullTypeInformation: boolean;
    readonly nativeAPIContext: NativeAPIContext | undefined;
    readonly api: API<boolean>;
    readonly snapshot: Snapshot;
    readonly project: Project;
    readonly program: Program;
    readonly checker: Checker;
    getTypeAtLocation(node: Node): Type;
    getSymbolAtLocation(node: Node): NativeSymbol | undefined;
}

export interface SourceCode {
    readonly text: string;
    readonly ast: TSESTree.Program;
    readonly lines: readonly string[];
    readonly hasBOM: boolean;
    readonly parserServices: ParserServices;
    readonly scopeManager: ScopeManager;
    readonly visitorKeys: Readonly<Record<string, readonly string[]>>;
    getText(node?: Node | Token | Comment | undefined, beforeCount?: number | undefined, afterCount?: number | undefined): string;
    getLines(): string[];
    getAllComments(): Comment[];
    getAncestors(node: Node): Node[];
    getDeclaredVariables(node: Node): Variable[];
    getNodeByRangeIndex(index: number): Node | null;
    getLocFromIndex(index: number): LineColumn;
    getIndexFromLoc(location: LineColumn): number;
    getLoc(node: Node | Token | Comment): Location;
    getRange(node: Node | Token | Comment): [number, number];
    getScope(node: Node): Scope;
    isGlobalReference(node: TSESTree.Identifier): boolean;
    markVariableAsUsed(name: string, node?: Node | undefined): boolean;
    getFirstToken: TokenCursor;
    getLastToken: TokenCursor;
    getTokenBefore: TokenCursor;
    getTokenAfter: TokenCursor;
    getTokenByRangeStart(offset: number, options?: { includeComments?: false | undefined; } | undefined): Token | null;
    getTokenByRangeStart(offset: number, options?: TokenOptions | undefined): Token | Comment | null;
    getTokens: TokensCursor & ((node: Node, beforeCount: number, afterCount: number) => Token[]);
    getFirstTokens: TokensCursor;
    getLastTokens: TokensCursor;
    getTokensBefore: TokensCursor;
    getTokensAfter: TokensCursor;
    getFirstTokenBetween: BetweenTokenCursor;
    getLastTokenBetween: BetweenTokenCursor;
    getTokensBetween: BetweenTokensCursor;
    getFirstTokensBetween: BetweenTokensCursor;
    getLastTokensBetween: BetweenTokensCursor;
    getCommentsBefore(node: Node | Token): Comment[];
    getCommentsAfter(node: Node | Token): Comment[];
    getCommentsInside(node: Node | Token): Comment[];
    commentsExistBetween(left: Node | Token, right: Node | Token): boolean;
    isSpaceBetween(left: Node | Token, right: Node | Token): boolean;
}

type Edit = Fix | Iterable<Fix> | null;
type Message = { message: string; messageId?: never; } | { messageId: string; message?: never; };
type SuggestionMessage = { desc: string; messageId?: never; } | { messageId: string; desc?: never; };
type ReportLocation = { node: Node | Token | Comment; loc?: Location | LineColumn | undefined; } | { node?: Node | Token | Comment | undefined; loc: Location | LineColumn; };

export type Report = Message & ReportLocation & {
    data?: Record<string, unknown> | undefined;
    fix?: ((fixer: Fixer) => Edit) | undefined;
    suggest?:
        | readonly (SuggestionMessage & {
            data?: Record<string, unknown> | undefined;
            fix(fixer: Fixer): Edit;
        })[]
        | undefined;
};

export interface Context<Options extends readonly unknown[] = readonly unknown[]> {
    readonly id: string;
    readonly options: Options;
    readonly filename: string;
    readonly physicalFilename: string;
    readonly cwd: string;
    readonly sourceCode: SourceCode;
    readonly languageOptions: Linter.LanguageOptions;
    readonly settings: Readonly<Record<string, unknown>>;
    report(report: Report): void;
}

type Callback<T> = { visit(node: T): void; }["visit"];
type NodeVisitors = {
    [Type in Node["type"]]?: Callback<Extract<Node, { type: Type; }>> | undefined;
};
type ExitVisitors = {
    [Type in Node["type"] as `${Type}:exit`]?: Callback<Extract<Node, { type: Type; }>> | undefined;
};

export type Visitor = NodeVisitors & ExitVisitors & { [selector: string]: Callback<Node> | undefined; };
export type CreateRule<Options extends readonly unknown[] = readonly unknown[]> = (context: Context<Options>) => Visitor;

export interface Plugin {
    meta?: { name?: string | undefined; version?: string | undefined; namespace?: string | undefined; } | undefined;
    rules?: Record<string, { meta?: RuleMeta | undefined; create(context: Context): Visitor; }> | undefined;
}

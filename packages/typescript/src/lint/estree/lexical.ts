// Token classification is adapted from typescript-eslint. See LICENSE.
import {
    AST_TOKEN_TYPES,
    type TSESTree,
} from "@typescript-eslint/types";
import {
    createScanner,
    type Identifier,
    isLiteralLikeNode,
    isNoSubstitutionTemplateLiteral,
    isTokenKind,
    type Node,
    NodeFlags,
    type Scanner,
    type SourceFile,
    SyntaxKind,
    type TemplateLiteralToken,
    TokenFlags,
} from "../../ast/index.ts";
import {
    Located,
    nativeRange,
} from "./location.ts";

type TokenData<T extends TSESTree.Token = TSESTree.Token> = T extends TSESTree.Token ? Omit<T, "range" | "loc"> : never;

export class ConversionError extends SyntaxError {
    readonly index: number;
    readonly lineNumber: number;
    readonly column: number;

    constructor(sourceFile: SourceFile, index: number, message: string) {
        const position = sourceFile.getLineAndCharacterOfPosition(index);
        super(`${message} (${sourceFile.fileName}:${position.line + 1}:${position.character + 1})`);
        this.index = index;
        this.lineNumber = position.line + 1;
        this.column = position.character + 1;
    }
}

export interface Lexeme {
    kind: SyntaxKind;
    start: number;
    end: number;
}

/** A single ordered scan of the gaps between native AST leaves. */
export class LexicalData {
    readonly tokens: TSESTree.Token[] = [];
    readonly comments: TSESTree.Comment[] = [];
    readonly #kinds: SyntaxKind[] = [];
    readonly #sourceFile: SourceFile;
    readonly #text: string;
    readonly #offset: number;
    readonly #leaves: Node[] = [];
    // Overlapping nodes share trivia starts; cap dense storage for large comments/literals.
    readonly #starts: Uint32Array;
    #lateStarts: Map<number, number> | undefined;
    readonly #templateFlags = new WeakMap<Node, TokenFlags>();
    readonly #collectChild: (node: Node) => void = this.collect.bind(this);

    constructor(sourceFile: SourceFile, offset = 0) {
        this.#sourceFile = sourceFile;
        this.#text = sourceFile.text;
        this.#offset = offset;
        this.#starts = new Uint32Array(Math.min(this.#text.length + 1, 65536));
        if (sourceFile.endOfFileToken.end !== this.#text.length) throw this.error(0, "Native source text does not match its UTF-16 ranges");
        this.collect(sourceFile);
        const scanner = createScanner(false, sourceFile.languageVariant, sourceFile.text);
        let position = 0;
        for (const leaf of this.#leaves) {
            const start = leaf.kind === SyntaxKind.JsxText || leaf.kind === SyntaxKind.JsxTextAllWhiteSpaces ? leaf.pos : this.start(leaf);
            if (start < position) throw this.error(start, "Overlapping native syntax");
            this.scan(scanner, position, start);
            if (isNoSubstitutionTemplateLiteral(leaf) && leaf.parent.kind === SyntaxKind.TaggedTemplateExpression) {
                // This token's native wire shape does not carry its template escape flags.
                scanner.setText(sourceFile.text, start, leaf.end - start);
                scanner.scan();
                if (scanner.isUnterminated()) throw this.error(start, "Unterminated native template");
                this.#templateFlags.set(leaf, scanner.getTokenFlags());
            }
            this.add(leaf.kind, start, leaf.end, leaf);
            position = leaf.end;
        }
        this.scan(scanner, position, sourceFile.text.length);
    }

    private scan(scanner: Scanner, start: number, end: number): void {
        if (start === end) return;
        scanner.setText(this.#text, start, end - start);
        for (let kind = scanner.scan(); kind !== SyntaxKind.EndOfFile; kind = scanner.scan()) {
            const tokenStart = scanner.getTokenStart();
            const tokenEnd = scanner.getTokenEnd();
            if (scanner.isUnterminated()) throw this.error(tokenStart, "Unterminated native token");
            if (kind === SyntaxKind.LessThanLessThanToken) {
                // Shift operators are native leaves. In a gap, << opens nested generics.
                this.add(SyntaxKind.LessThanToken, tokenStart, tokenStart + 1);
                this.add(SyntaxKind.LessThanToken, tokenStart + 1, tokenEnd);
            }
            else this.add(kind, tokenStart, tokenEnd);
        }
    }

    start(node: Node): number {
        const pos = node.pos;
        if (pos === node.end) return pos;
        const kind = node.kind;
        if (kind === SyntaxKind.JsxText || kind === SyntaxKind.JsxTextAllWhiteSpaces || kind >= SyntaxKind.FirstJSDocNode && kind <= SyntaxKind.LastJSDocNode || node.flags & NodeFlags.JSDoc) {
            return node.getStart(this.#sourceFile);
        }
        let start = pos < this.#starts.length ? this.#starts[pos] : this.#lateStarts?.get(pos);
        if (!start) {
            start = node.getStart(this.#sourceFile) + 1;
            if (pos < this.#starts.length) this.#starts[pos] = start;
            else (this.#lateStarts ??= new Map()).set(pos, start);
        }
        return start - 1;
    }

    error(position: number, message: string): ConversionError {
        return new ConversionError(this.#sourceFile, Math.max(0, position), message);
    }

    templateFlags(node: TemplateLiteralToken): TokenFlags {
        return isNoSubstitutionTemplateLiteral(node) ? this.#templateFlags.get(node) ?? TokenFlags.None : node.templateFlags;
    }

    identifierText(node: Identifier, start: number): string {
        const text = this.#text.slice(start, node.end);
        return text.includes("\\") ? node.text : text;
    }

    /** Index of the first token whose start is at least position. */
    indexAt(position: number): number {
        let low = 0;
        let high = this.tokens.length;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (nativeRange(this.tokens[mid])[0] < position) low = mid + 1;
            else high = mid;
        }
        return low;
    }

    at(position: number, kind?: SyntaxKind): Lexeme {
        const index = this.indexAt(position);
        const token = this.tokens[index];
        if (!token || kind !== undefined && this.#kinds[index] !== kind) {
            throw this.error(position, `Expected ${kind === undefined ? "token" : SyntaxKind[kind]}`);
        }
        return { kind: this.#kinds[index], start: nativeRange(token)[0], end: nativeRange(token)[1] };
    }

    before(position: number, kind?: SyntaxKind): Lexeme {
        const index = this.indexAt(position) - 1;
        const token = this.tokens[index];
        if (!token || kind !== undefined && this.#kinds[index] !== kind) {
            throw this.error(position, `Expected preceding ${kind === undefined ? "token" : SyntaxKind[kind]}`);
        }
        return { kind: this.#kinds[index], start: nativeRange(token)[0], end: nativeRange(token)[1] };
    }

    private collect(node: Node): void {
        // JSDoc-derived annotations and inserted namespace modifiers are not source tokens.
        const flags = node.flags;
        if (flags & NodeFlags.Reparsed) return;
        const kind = node.kind;
        if (kind >= SyntaxKind.FirstJSDocNode && kind <= SyntaxKind.LastJSDocNode) return;
        if (flags & NodeFlags.ThisNodeHasError) throw this.error(this.start(node), "Cannot convert invalid native syntax");
        if (kind >= SyntaxKind.FirstLiteralToken && kind <= SyntaxKind.LastTemplateToken && (isLiteralLikeNode(node) || isNoSubstitutionTemplateLiteral(node)) && node.tokenFlags & TokenFlags.Unterminated) throw this.error(this.start(node), "Unterminated native literal");
        if (isTokenKind(kind)) {
            if (kind !== SyntaxKind.EndOfFile) {
                if (node.pos === node.end) throw this.error(node.pos, "Missing native token");
                this.#leaves.push(node);
            }
            return;
        }
        node.forEachChild(this.#collectChild);
    }

    private add(kind: SyntaxKind, start: number, end: number, native?: Node): void {
        if (kind === SyntaxKind.LessThanSlashToken) {
            this.add(SyntaxKind.LessThanToken, start, start + 1);
            this.add(SyntaxKind.SlashToken, start + 1, end);
            return;
        }
        const text = this.#text.slice(start, end);
        if (kind === SyntaxKind.WhitespaceTrivia || kind === SyntaxKind.NewLineTrivia) return;
        if (kind === SyntaxKind.SingleLineCommentTrivia || kind === SyntaxKind.MultiLineCommentTrivia) {
            this.comments.push(Located.create(
                {
                    type: kind === SyntaxKind.SingleLineCommentTrivia ? AST_TOKEN_TYPES.Line : AST_TOKEN_TYPES.Block,
                    value: text.slice(2, kind === SyntaxKind.SingleLineCommentTrivia ? undefined : -2),
                } as const,
                this.#sourceFile,
                start,
                end,
                this.#offset,
            ));
            return;
        }
        if (kind === SyntaxKind.Unknown && start === 0 && text.startsWith("#!")) return;
        if (kind === SyntaxKind.Unknown || kind === SyntaxKind.ConflictMarkerTrivia || kind === SyntaxKind.NonTextFileMarkerTrivia) {
            throw this.error(start, `Unexpected ${SyntaxKind[kind]}`);
        }
        this.#kinds.push(kind);
        switch (kind) {
            case SyntaxKind.RegularExpressionLiteral: {
                const lastSlash = text.lastIndexOf("/");
                this.token(start, end, {
                    type: AST_TOKEN_TYPES.RegularExpression,
                    value: text,
                    regex: { pattern: text.slice(1, lastSlash), flags: text.slice(lastSlash + 1) },
                });
                return;
            }
            case SyntaxKind.PrivateIdentifier:
                this.token(start, end, { type: AST_TOKEN_TYPES.PrivateIdentifier, value: text.slice(1) });
                return;
            case SyntaxKind.NumericLiteral:
            case SyntaxKind.BigIntLiteral:
                this.token(start, end, { type: AST_TOKEN_TYPES.Numeric, value: text });
                return;
            case SyntaxKind.StringLiteral:
                this.token(start, end, {
                    type: native?.parent.kind === SyntaxKind.JsxAttribute ? AST_TOKEN_TYPES.JSXText : AST_TOKEN_TYPES.String,
                    value: text,
                });
                return;
            case SyntaxKind.JsxText:
            case SyntaxKind.JsxTextAllWhiteSpaces:
                this.token(start, end, { type: AST_TOKEN_TYPES.JSXText, value: text });
                return;
            case SyntaxKind.NoSubstitutionTemplateLiteral:
            case SyntaxKind.TemplateHead:
            case SyntaxKind.TemplateMiddle:
            case SyntaxKind.TemplateTail:
                this.token(start, end, { type: AST_TOKEN_TYPES.Template, value: text });
                return;
            case SyntaxKind.NullKeyword:
                this.token(start, end, { type: AST_TOKEN_TYPES.Null, value: text });
                return;
            case SyntaxKind.TrueKeyword:
            case SyntaxKind.FalseKeyword:
                this.token(start, end, { type: AST_TOKEN_TYPES.Boolean, value: text });
                return;
        }
        if (kind >= SyntaxKind.FirstPunctuation && kind <= SyntaxKind.LastPunctuation) {
            if (!isPunctuator(text)) throw this.error(start, `Unexpected punctuator ${text}`);
            this.token(start, end, { type: AST_TOKEN_TYPES.Punctuator, value: text });
        }
        else if (kind >= SyntaxKind.FirstKeyword && kind <= SyntaxKind.LastFutureReservedWord) {
            this.token(start, end, { type: AST_TOKEN_TYPES.Keyword, value: text });
        }
        else if (kind === SyntaxKind.Identifier || kind >= SyntaxKind.FirstContextualKeyword && kind <= SyntaxKind.LastContextualKeyword) {
            this.token(start, end, {
                type: kind === SyntaxKind.Identifier && native && isJSXIdentifier(native) ? AST_TOKEN_TYPES.JSXIdentifier : AST_TOKEN_TYPES.Identifier,
                value: text,
            });
        }
        else throw this.error(start, `Unexpected native token ${SyntaxKind[kind]}`);
    }

    private token(start: number, end: number, data: TokenData): void {
        this.tokens.push(Located.create(data, this.#sourceFile, start, end, this.#offset));
    }
}

function isJSXIdentifier(node: Node): boolean {
    let parent = node.parent;
    while (parent.kind === SyntaxKind.PropertyAccessExpression) parent = parent.parent;
    return parent.kind >= SyntaxKind.JsxElement && parent.kind <= SyntaxKind.JsxAttribute;
}

const punctuators: ReadonlySet<string> = new Set(
    [
        "{",
        "}",
        "(",
        ")",
        "[",
        "]",
        ".",
        "...",
        ";",
        ",",
        "<",
        "</",
        ">",
        "<=",
        ">=",
        "==",
        "!=",
        "===",
        "!==",
        "=>",
        "+",
        "-",
        "**",
        "*",
        "/",
        "%",
        "++",
        "--",
        "<<",
        ">>",
        ">>>",
        "&",
        "|",
        "^",
        "!",
        "~",
        "&&",
        "||",
        "?",
        "??",
        "?.",
        ":",
        "=",
        "+=",
        "-=",
        "*=",
        "**=",
        "/=",
        "%=",
        "<<=",
        ">>=",
        ">>>=",
        "&=",
        "|=",
        "^=",
        "||=",
        "&&=",
        "??=",
        "@",
        "#",
        "`",
    ] satisfies readonly TSESTree.PunctuatorToken["value"][],
);

function isPunctuator(value: string): value is TSESTree.PunctuatorToken["value"] {
    return punctuators.has(value);
}

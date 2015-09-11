import {SourceFile} from "../services/services";
import {
    TypeChecker, Program,
    Node, SyntaxKind, TypeFormatFlags
} from "../compiler/types";
import {
    isExpression, getTextOfNodeFromSourceText, isExpressionWithTypeArgumentsInClassExtendsClause
} from "../compiler/utilities";
import {
    Debug, getBaseFileName
} from "../compiler/core";
import {forEachChild} from "../compiler/parser";
import {skipTrivia} from "../compiler/scanner";

export interface TypeWriterResult {
    line: number;
    syntaxKind: number;
    sourceText: string;
    type: string;
    symbol: string;
}

export class TypeWriterWalker {
    results: TypeWriterResult[];
    currentSourceFile: SourceFile;

    private checker: TypeChecker;

    constructor(private program: Program, fullTypeCheck: boolean) {
        // Consider getting both the diagnostics checker and the non-diagnostics checker to verify
        // they are consistent.
        this.checker = fullTypeCheck
            ? program.getDiagnosticsProducingTypeChecker()
            : program.getTypeChecker();
    }

    public getTypeAndSymbols(fileName: string): TypeWriterResult[] {
        let sourceFile = this.program.getSourceFile(fileName);
        this.currentSourceFile = sourceFile;
        this.results = [];
        this.visitNode(sourceFile);
        return this.results;
    }

    private visitNode(node: Node): void {
        if (isExpression(node) || node.kind === SyntaxKind.Identifier) {
            this.logTypeAndSymbol(node);
        }

        forEachChild(node, child => this.visitNode(child));
    }

    private logTypeAndSymbol(node: Node): void {
        let actualPos = skipTrivia(this.currentSourceFile.text, node.pos);
        let lineAndCharacter = this.currentSourceFile.getLineAndCharacterOfPosition(actualPos);
        let sourceText = getTextOfNodeFromSourceText(this.currentSourceFile.text, node);

        // Workaround to ensure we output 'C' instead of 'typeof C' for base class expressions
        // let type = this.checker.getTypeAtLocation(node);
        let type = node.parent && isExpressionWithTypeArgumentsInClassExtendsClause(node.parent) && this.checker.getTypeAtLocation(node.parent) || this.checker.getTypeAtLocation(node);

        Debug.assert(type !== undefined, "type doesn't exist");
        let symbol = this.checker.getSymbolAtLocation(node);

        let typeString = this.checker.typeToString(type, node.parent, TypeFormatFlags.NoTruncation);
        let symbolString: string;
        if (symbol) {
            symbolString = "Symbol(" + this.checker.symbolToString(symbol, node.parent);
            if (symbol.declarations) {
                for (let declaration of symbol.declarations) {
                    symbolString += ", ";
                    let declSourceFile = declaration.getSourceFile();
                    let declLineAndCharacter = declSourceFile.getLineAndCharacterOfPosition(declaration.pos);
                    symbolString += `Decl(${ getBaseFileName(declSourceFile.fileName) }, ${ declLineAndCharacter.line }, ${ declLineAndCharacter.character })`;
                }
            }
            symbolString += ")";
        }

        this.results.push({
            line: lineAndCharacter.line,
            syntaxKind: node.kind,
            sourceText: sourceText,
            type: typeString,
            symbol: symbolString
        });
    }
}
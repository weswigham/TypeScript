import * as ts from "../ts";
/* @internal */
const fixId = "convertFunctionToEs6Class";
/* @internal */
const errorCodes = [ts.Diagnostics.This_constructor_function_may_be_converted_to_a_class_declaration.code];
/* @internal */
ts.codefix.registerCodeFix({
    errorCodes,
    getCodeActions(context: ts.CodeFixContext) {
        const changes = ts.textChanges.ChangeTracker.with(context, t => doChange(t, context.sourceFile, context.span.start, context.program.getTypeChecker()));
        return [ts.codefix.createCodeFixAction(fixId, changes, ts.Diagnostics.Convert_function_to_an_ES2015_class, fixId, ts.Diagnostics.Convert_all_constructor_functions_to_classes)];
    },
    fixIds: [fixId],
    getAllCodeActions: context => ts.codefix.codeFixAll(context, errorCodes, (changes, err) => doChange(changes, err.file, err.start, context.program.getTypeChecker())),
});
/* @internal */
function doChange(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, position: number, checker: ts.TypeChecker): void {
    const ctorSymbol = (checker.getSymbolAtLocation(ts.getTokenAtPosition(sourceFile, position))!);
    if (!ctorSymbol || !(ctorSymbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable))) {
        // Bad input
        return undefined;
    }
    const ctorDeclaration = ctorSymbol.valueDeclaration;
    let precedingNode: ts.Node | undefined;
    let newClassDeclaration: ts.ClassDeclaration | undefined;
    switch (ctorDeclaration.kind) {
        case ts.SyntaxKind.FunctionDeclaration:
            precedingNode = ctorDeclaration;
            changes.delete(sourceFile, ctorDeclaration);
            newClassDeclaration = createClassFromFunctionDeclaration((ctorDeclaration as ts.FunctionDeclaration));
            break;
        case ts.SyntaxKind.VariableDeclaration:
            precedingNode = ctorDeclaration.parent.parent;
            newClassDeclaration = createClassFromVariableDeclaration((ctorDeclaration as ts.VariableDeclaration));
            if ((<ts.VariableDeclarationList>ctorDeclaration.parent).declarations.length === 1) {
                ts.copyLeadingComments(precedingNode, (newClassDeclaration!), sourceFile); // TODO: GH#18217
                changes.delete(sourceFile, precedingNode);
            }
            else {
                changes.delete(sourceFile, ctorDeclaration);
            }
            break;
    }
    if (!newClassDeclaration) {
        return undefined;
    }
    ts.copyLeadingComments(ctorDeclaration, newClassDeclaration, sourceFile);
    // Because the preceding node could be touched, we need to insert nodes before delete nodes.
    changes.insertNodeAfter(sourceFile, precedingNode!, newClassDeclaration);
    function createClassElementsFromSymbol(symbol: ts.Symbol) {
        const memberElements: ts.ClassElement[] = [];
        // all instance members are stored in the "member" array of symbol
        if (symbol.members) {
            symbol.members.forEach(member => {
                const memberElement = createClassElement(member, /*modifiers*/ undefined);
                if (memberElement) {
                    memberElements.push(memberElement);
                }
            });
        }
        // all static members are stored in the "exports" array of symbol
        if (symbol.exports) {
            symbol.exports.forEach(member => {
                const memberElement = createClassElement(member, [ts.createToken(ts.SyntaxKind.StaticKeyword)]);
                if (memberElement) {
                    memberElements.push(memberElement);
                }
            });
        }
        return memberElements;
        function shouldConvertDeclaration(_target: ts.PropertyAccessExpression, source: ts.Expression) {
            // Right now the only thing we can convert are function expressions - other values shouldn't get
            // transformed. We can update this once ES public class properties are available.
            return ts.isFunctionLike(source);
        }
        function createClassElement(symbol: ts.Symbol, modifiers: ts.Modifier[] | undefined): ts.ClassElement | undefined {
            // Right now the only thing we can convert are function expressions, which are marked as methods
            if (!(symbol.flags & ts.SymbolFlags.Method)) {
                return;
            }
            const memberDeclaration = (symbol.valueDeclaration as ts.PropertyAccessExpression);
            const assignmentBinaryExpression = (memberDeclaration.parent as ts.BinaryExpression);
            if (!shouldConvertDeclaration(memberDeclaration, assignmentBinaryExpression.right)) {
                return;
            }
            // delete the entire statement if this expression is the sole expression to take care of the semicolon at the end
            const nodeToDelete = assignmentBinaryExpression.parent && assignmentBinaryExpression.parent.kind === ts.SyntaxKind.ExpressionStatement
                ? assignmentBinaryExpression.parent : assignmentBinaryExpression;
            changes.delete(sourceFile, nodeToDelete);
            if (!assignmentBinaryExpression.right) {
                return ts.createProperty([], modifiers, symbol.name, /*questionToken*/ undefined, 
                /*type*/ undefined, /*initializer*/ undefined);
            }
            switch (assignmentBinaryExpression.right.kind) {
                case ts.SyntaxKind.FunctionExpression: {
                    const functionExpression = (assignmentBinaryExpression.right as ts.FunctionExpression);
                    const fullModifiers = ts.concatenate(modifiers, getModifierKindFromSource(functionExpression, ts.SyntaxKind.AsyncKeyword));
                    const method = ts.createMethod(/*decorators*/ undefined, fullModifiers, /*asteriskToken*/ undefined, memberDeclaration.name, /*questionToken*/ undefined, 
                    /*typeParameters*/ undefined, functionExpression.parameters, /*type*/ undefined, functionExpression.body);
                    ts.copyLeadingComments(assignmentBinaryExpression, method, sourceFile);
                    return method;
                }
                case ts.SyntaxKind.ArrowFunction: {
                    const arrowFunction = (assignmentBinaryExpression.right as ts.ArrowFunction);
                    const arrowFunctionBody = arrowFunction.body;
                    let bodyBlock: ts.Block;
                    // case 1: () => { return [1,2,3] }
                    if (arrowFunctionBody.kind === ts.SyntaxKind.Block) {
                        bodyBlock = (arrowFunctionBody as ts.Block);
                    }
                    // case 2: () => [1,2,3]
                    else {
                        bodyBlock = ts.createBlock([ts.createReturn(arrowFunctionBody)]);
                    }
                    const fullModifiers = ts.concatenate(modifiers, getModifierKindFromSource(arrowFunction, ts.SyntaxKind.AsyncKeyword));
                    const method = ts.createMethod(/*decorators*/ undefined, fullModifiers, /*asteriskToken*/ undefined, memberDeclaration.name, /*questionToken*/ undefined, 
                    /*typeParameters*/ undefined, arrowFunction.parameters, /*type*/ undefined, bodyBlock);
                    ts.copyLeadingComments(assignmentBinaryExpression, method, sourceFile);
                    return method;
                }
                default: {
                    // Don't try to declare members in JavaScript files
                    if (ts.isSourceFileJS(sourceFile)) {
                        return;
                    }
                    const prop = ts.createProperty(/*decorators*/ undefined, modifiers, memberDeclaration.name, /*questionToken*/ undefined, 
                    /*type*/ undefined, assignmentBinaryExpression.right);
                    ts.copyLeadingComments(assignmentBinaryExpression.parent, prop, sourceFile);
                    return prop;
                }
            }
        }
    }
    function createClassFromVariableDeclaration(node: ts.VariableDeclaration): ts.ClassDeclaration | undefined {
        const initializer = (node.initializer as ts.FunctionExpression);
        if (!initializer || initializer.kind !== ts.SyntaxKind.FunctionExpression) {
            return undefined;
        }
        if (node.name.kind !== ts.SyntaxKind.Identifier) {
            return undefined;
        }
        const memberElements = createClassElementsFromSymbol(node.symbol);
        if (initializer.body) {
            memberElements.unshift(ts.createConstructor(/*decorators*/ undefined, /*modifiers*/ undefined, initializer.parameters, initializer.body));
        }
        const modifiers = getModifierKindFromSource((precedingNode!), ts.SyntaxKind.ExportKeyword);
        const cls = ts.createClassDeclaration(/*decorators*/ undefined, modifiers, node.name, 
        /*typeParameters*/ undefined, /*heritageClauses*/ undefined, memberElements);
        // Don't call copyComments here because we'll already leave them in place
        return cls;
    }
    function createClassFromFunctionDeclaration(node: ts.FunctionDeclaration): ts.ClassDeclaration {
        const memberElements = createClassElementsFromSymbol(ctorSymbol);
        if (node.body) {
            memberElements.unshift(ts.createConstructor(/*decorators*/ undefined, /*modifiers*/ undefined, node.parameters, node.body));
        }
        const modifiers = getModifierKindFromSource(node, ts.SyntaxKind.ExportKeyword);
        const cls = ts.createClassDeclaration(/*decorators*/ undefined, modifiers, node.name, 
        /*typeParameters*/ undefined, /*heritageClauses*/ undefined, memberElements);
        // Don't call copyComments here because we'll already leave them in place
        return cls;
    }
}
/* @internal */
function getModifierKindFromSource(source: ts.Node, kind: ts.SyntaxKind): readonly ts.Modifier[] | undefined {
    return ts.filter(source.modifiers, modifier => modifier.kind === kind);
}

import * as ts from "./ts";
const isTypeNodeOrTypeParameterDeclaration = ts.or(ts.isTypeNode, ts.isTypeParameterDeclaration);
/**
 * Visits a Node using the supplied visitor, possibly returning a new Node in its place.
 *
 * @param node The Node to visit.
 * @param visitor The callback used to visit the Node.
 * @param test A callback to execute to verify the Node is valid.
 * @param lift An optional callback to execute to lift a NodeArray into a valid Node.
 */
export function visitNode<T extends ts.Node>(node: T | undefined, visitor: ts.Visitor | undefined, test?: (node: ts.Node) => boolean, lift?: (node: ts.NodeArray<ts.Node>) => T): T;
/**
 * Visits a Node using the supplied visitor, possibly returning a new Node in its place.
 *
 * @param node The Node to visit.
 * @param visitor The callback used to visit the Node.
 * @param test A callback to execute to verify the Node is valid.
 * @param lift An optional callback to execute to lift a NodeArray into a valid Node.
 */
export function visitNode<T extends ts.Node>(node: T | undefined, visitor: ts.Visitor | undefined, test?: (node: ts.Node) => boolean, lift?: (node: ts.NodeArray<ts.Node>) => T): T | undefined;
export function visitNode<T extends ts.Node>(node: T | undefined, visitor: ts.Visitor | undefined, test?: (node: ts.Node) => boolean, lift?: (node: ts.NodeArray<ts.Node>) => T): T | undefined {
    if (node === undefined || visitor === undefined) {
        return node;
    }
    ts.aggregateTransformFlags(node);
    const visited = visitor(node);
    if (visited === node) {
        return node;
    }
    let visitedNode: ts.Node | undefined;
    if (visited === undefined) {
        return undefined;
    }
    else if (ts.isArray(visited)) {
        visitedNode = (lift || extractSingleNode)(visited);
    }
    else {
        visitedNode = visited;
    }
    ts.Debug.assertNode(visitedNode, test);
    ts.aggregateTransformFlags((visitedNode!));
    return <T>visitedNode;
}
/**
 * Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.
 *
 * @param nodes The NodeArray to visit.
 * @param visitor The callback used to visit a Node.
 * @param test A node test to execute for each node.
 * @param start An optional value indicating the starting offset at which to start visiting.
 * @param count An optional value indicating the maximum number of nodes to visit.
 */
export function visitNodes<T extends ts.Node>(nodes: ts.NodeArray<T> | undefined, visitor: ts.Visitor, test?: (node: ts.Node) => boolean, start?: number, count?: number): ts.NodeArray<T>;
/**
 * Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.
 *
 * @param nodes The NodeArray to visit.
 * @param visitor The callback used to visit a Node.
 * @param test A node test to execute for each node.
 * @param start An optional value indicating the starting offset at which to start visiting.
 * @param count An optional value indicating the maximum number of nodes to visit.
 */
export function visitNodes<T extends ts.Node>(nodes: ts.NodeArray<T> | undefined, visitor: ts.Visitor, test?: (node: ts.Node) => boolean, start?: number, count?: number): ts.NodeArray<T> | undefined;
/**
 * Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.
 *
 * @param nodes The NodeArray to visit.
 * @param visitor The callback used to visit a Node.
 * @param test A node test to execute for each node.
 * @param start An optional value indicating the starting offset at which to start visiting.
 * @param count An optional value indicating the maximum number of nodes to visit.
 */
export function visitNodes<T extends ts.Node>(nodes: ts.NodeArray<T> | undefined, visitor: ts.Visitor, test?: (node: ts.Node) => boolean, start?: number, count?: number): ts.NodeArray<T> | undefined {
    if (nodes === undefined || visitor === undefined) {
        return nodes;
    }
    let updated: ts.MutableNodeArray<T> | undefined;
    // Ensure start and count have valid values
    const length = nodes.length;
    if (start === undefined || start < 0) {
        start = 0;
    }
    if (count === undefined || count > length - start) {
        count = length - start;
    }
    if (start > 0 || count < length) {
        // If we are not visiting all of the original nodes, we must always create a new array.
        // Since this is a fragment of a node array, we do not copy over the previous location
        // and will only copy over `hasTrailingComma` if we are including the last element.
        updated = ts.createNodeArray<T>([], /*hasTrailingComma*/ nodes.hasTrailingComma && start + count === length);
    }
    // Visit each original node.
    for (let i = 0; i < count; i++) {
        const node = nodes[i + start];
        ts.aggregateTransformFlags(node);
        const visited = node !== undefined ? visitor(node) : undefined;
        if (updated !== undefined || visited === undefined || visited !== node) {
            if (updated === undefined) {
                // Ensure we have a copy of `nodes`, up to the current index.
                updated = ts.createNodeArray(nodes.slice(0, i), nodes.hasTrailingComma);
                ts.setTextRange(updated, nodes);
            }
            if (visited) {
                if (ts.isArray(visited)) {
                    for (const visitedNode of visited) {
                        ts.Debug.assertNode(visitedNode, test);
                        ts.aggregateTransformFlags(visitedNode);
                        updated.push(<T>visitedNode);
                    }
                }
                else {
                    ts.Debug.assertNode(visited, test);
                    ts.aggregateTransformFlags(visited);
                    updated.push(<T>visited);
                }
            }
        }
    }
    return updated || nodes;
}
/**
 * Starts a new lexical environment and visits a statement list, ending the lexical environment
 * and merging hoisted declarations upon completion.
 */
export function visitLexicalEnvironment(statements: ts.NodeArray<ts.Statement>, visitor: ts.Visitor, context: ts.TransformationContext, start?: number, ensureUseStrict?: boolean) {
    context.startLexicalEnvironment();
    statements = visitNodes(statements, visitor, ts.isStatement, start);
    if (ensureUseStrict)
        statements = ts.ensureUseStrict(statements); // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
    return ts.mergeLexicalEnvironment(statements, context.endLexicalEnvironment());
}
/**
 * Starts a new lexical environment and visits a parameter list, suspending the lexical
 * environment upon completion.
 */
export function visitParameterList(nodes: ts.NodeArray<ts.ParameterDeclaration> | undefined, visitor: ts.Visitor, context: ts.TransformationContext, nodesVisitor = visitNodes) {
    context.startLexicalEnvironment();
    const updated = nodesVisitor(nodes, visitor, ts.isParameterDeclaration);
    context.suspendLexicalEnvironment();
    return updated;
}
/**
 * Resumes a suspended lexical environment and visits a function body, ending the lexical
 * environment and merging hoisted declarations upon completion.
 */
export function visitFunctionBody(node: ts.FunctionBody, visitor: ts.Visitor, context: ts.TransformationContext): ts.FunctionBody;
/**
 * Resumes a suspended lexical environment and visits a function body, ending the lexical
 * environment and merging hoisted declarations upon completion.
 */
export function visitFunctionBody(node: ts.FunctionBody | undefined, visitor: ts.Visitor, context: ts.TransformationContext): ts.FunctionBody | undefined;
/**
 * Resumes a suspended lexical environment and visits a concise body, ending the lexical
 * environment and merging hoisted declarations upon completion.
 */
export function visitFunctionBody(node: ts.ConciseBody, visitor: ts.Visitor, context: ts.TransformationContext): ts.ConciseBody;
export function visitFunctionBody(node: ts.ConciseBody | undefined, visitor: ts.Visitor, context: ts.TransformationContext): ts.ConciseBody | undefined {
    context.resumeLexicalEnvironment();
    const updated = visitNode(node, visitor, ts.isConciseBody);
    const declarations = context.endLexicalEnvironment();
    if (ts.some(declarations)) {
        const block = ts.convertToFunctionBody(updated);
        const statements = ts.mergeLexicalEnvironment(block.statements, declarations);
        return ts.updateBlock(block, statements);
    }
    return updated;
}
/**
 * Visits each child of a Node using the supplied visitor, possibly returning a new Node of the same kind in its place.
 *
 * @param node The Node whose children will be visited.
 * @param visitor The callback used to visit each child.
 * @param context A lexical environment context for the visitor.
 */
export function visitEachChild<T extends ts.Node>(node: T, visitor: ts.Visitor, context: ts.TransformationContext): T;
/**
 * Visits each child of a Node using the supplied visitor, possibly returning a new Node of the same kind in its place.
 *
 * @param node The Node whose children will be visited.
 * @param visitor The callback used to visit each child.
 * @param context A lexical environment context for the visitor.
 */
export function visitEachChild<T extends ts.Node>(node: T | undefined, visitor: ts.Visitor, context: ts.TransformationContext, nodesVisitor?: typeof visitNodes, tokenVisitor?: ts.Visitor): T | undefined;
export function visitEachChild(node: ts.Node | undefined, visitor: ts.Visitor, context: ts.TransformationContext, nodesVisitor = visitNodes, tokenVisitor?: ts.Visitor): ts.Node | undefined {
    if (node === undefined) {
        return undefined;
    }
    const kind = node.kind;
    // No need to visit nodes with no children.
    if ((kind > ts.SyntaxKind.FirstToken && kind <= ts.SyntaxKind.LastToken) || kind === ts.SyntaxKind.ThisType) {
        return node;
    }
    switch (kind) {
        // Names
        case ts.SyntaxKind.Identifier:
            return ts.updateIdentifier((<ts.Identifier>node), nodesVisitor((<ts.Identifier>node).typeArguments, visitor, isTypeNodeOrTypeParameterDeclaration));
        case ts.SyntaxKind.QualifiedName:
            return ts.updateQualifiedName((<ts.QualifiedName>node), visitNode((<ts.QualifiedName>node).left, visitor, ts.isEntityName), visitNode((<ts.QualifiedName>node).right, visitor, ts.isIdentifier));
        case ts.SyntaxKind.ComputedPropertyName:
            return ts.updateComputedPropertyName((<ts.ComputedPropertyName>node), visitNode((<ts.ComputedPropertyName>node).expression, visitor, ts.isExpression));
        // Signature elements
        case ts.SyntaxKind.TypeParameter:
            return ts.updateTypeParameterDeclaration((<ts.TypeParameterDeclaration>node), visitNode((<ts.TypeParameterDeclaration>node).name, visitor, ts.isIdentifier), visitNode((<ts.TypeParameterDeclaration>node).constraint, visitor, ts.isTypeNode), visitNode((<ts.TypeParameterDeclaration>node).default, visitor, ts.isTypeNode));
        case ts.SyntaxKind.Parameter:
            return ts.updateParameter((<ts.ParameterDeclaration>node), nodesVisitor((<ts.ParameterDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.ParameterDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.ParameterDeclaration>node).dotDotDotToken, tokenVisitor, ts.isToken), visitNode((<ts.ParameterDeclaration>node).name, visitor, ts.isBindingName), visitNode((<ts.ParameterDeclaration>node).questionToken, tokenVisitor, ts.isToken), visitNode((<ts.ParameterDeclaration>node).type, visitor, ts.isTypeNode), visitNode((<ts.ParameterDeclaration>node).initializer, visitor, ts.isExpression));
        case ts.SyntaxKind.Decorator:
            return ts.updateDecorator((<ts.Decorator>node), visitNode((<ts.Decorator>node).expression, visitor, ts.isExpression));
        // Type elements
        case ts.SyntaxKind.PropertySignature:
            return ts.updatePropertySignature((<ts.PropertySignature>node), nodesVisitor((<ts.PropertySignature>node).modifiers, visitor, ts.isToken), visitNode((<ts.PropertySignature>node).name, visitor, ts.isPropertyName), visitNode((<ts.PropertySignature>node).questionToken, tokenVisitor, ts.isToken), visitNode((<ts.PropertySignature>node).type, visitor, ts.isTypeNode), visitNode((<ts.PropertySignature>node).initializer, visitor, ts.isExpression));
        case ts.SyntaxKind.PropertyDeclaration:
            return ts.updateProperty((<ts.PropertyDeclaration>node), nodesVisitor((<ts.PropertyDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.PropertyDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.PropertyDeclaration>node).name, visitor, ts.isPropertyName), 
            // QuestionToken and ExclamationToken is uniqued in Property Declaration and the signature of 'updateProperty' is that too
            visitNode((<ts.PropertyDeclaration>node).questionToken || (<ts.PropertyDeclaration>node).exclamationToken, tokenVisitor, ts.isToken), visitNode((<ts.PropertyDeclaration>node).type, visitor, ts.isTypeNode), visitNode((<ts.PropertyDeclaration>node).initializer, visitor, ts.isExpression));
        case ts.SyntaxKind.MethodSignature:
            return ts.updateMethodSignature((<ts.MethodSignature>node), nodesVisitor((<ts.MethodSignature>node).typeParameters, visitor, ts.isTypeParameterDeclaration), nodesVisitor((<ts.MethodSignature>node).parameters, visitor, ts.isParameterDeclaration), visitNode((<ts.MethodSignature>node).type, visitor, ts.isTypeNode), visitNode((<ts.MethodSignature>node).name, visitor, ts.isPropertyName), visitNode((<ts.MethodSignature>node).questionToken, tokenVisitor, ts.isToken));
        case ts.SyntaxKind.MethodDeclaration:
            return ts.updateMethod((<ts.MethodDeclaration>node), nodesVisitor((<ts.MethodDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.MethodDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.MethodDeclaration>node).asteriskToken, tokenVisitor, ts.isToken), visitNode((<ts.MethodDeclaration>node).name, visitor, ts.isPropertyName), visitNode((<ts.MethodDeclaration>node).questionToken, tokenVisitor, ts.isToken), nodesVisitor((<ts.MethodDeclaration>node).typeParameters, visitor, ts.isTypeParameterDeclaration), visitParameterList((<ts.MethodDeclaration>node).parameters, visitor, context, nodesVisitor), visitNode((<ts.MethodDeclaration>node).type, visitor, ts.isTypeNode), visitFunctionBody(((<ts.MethodDeclaration>node).body!), visitor, context));
        case ts.SyntaxKind.Constructor:
            return ts.updateConstructor((<ts.ConstructorDeclaration>node), nodesVisitor((<ts.ConstructorDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.ConstructorDeclaration>node).modifiers, visitor, ts.isModifier), visitParameterList((<ts.ConstructorDeclaration>node).parameters, visitor, context, nodesVisitor), visitFunctionBody(((<ts.ConstructorDeclaration>node).body!), visitor, context));
        case ts.SyntaxKind.GetAccessor:
            return ts.updateGetAccessor((<ts.GetAccessorDeclaration>node), nodesVisitor((<ts.GetAccessorDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.GetAccessorDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.GetAccessorDeclaration>node).name, visitor, ts.isPropertyName), visitParameterList((<ts.GetAccessorDeclaration>node).parameters, visitor, context, nodesVisitor), visitNode((<ts.GetAccessorDeclaration>node).type, visitor, ts.isTypeNode), visitFunctionBody(((<ts.GetAccessorDeclaration>node).body!), visitor, context));
        case ts.SyntaxKind.SetAccessor:
            return ts.updateSetAccessor((<ts.SetAccessorDeclaration>node), nodesVisitor((<ts.SetAccessorDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.SetAccessorDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.SetAccessorDeclaration>node).name, visitor, ts.isPropertyName), visitParameterList((<ts.SetAccessorDeclaration>node).parameters, visitor, context, nodesVisitor), visitFunctionBody(((<ts.SetAccessorDeclaration>node).body!), visitor, context));
        case ts.SyntaxKind.CallSignature:
            return ts.updateCallSignature((<ts.CallSignatureDeclaration>node), nodesVisitor((<ts.CallSignatureDeclaration>node).typeParameters, visitor, ts.isTypeParameterDeclaration), nodesVisitor((<ts.CallSignatureDeclaration>node).parameters, visitor, ts.isParameterDeclaration), visitNode((<ts.CallSignatureDeclaration>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.ConstructSignature:
            return ts.updateConstructSignature((<ts.ConstructSignatureDeclaration>node), nodesVisitor((<ts.ConstructSignatureDeclaration>node).typeParameters, visitor, ts.isTypeParameterDeclaration), nodesVisitor((<ts.ConstructSignatureDeclaration>node).parameters, visitor, ts.isParameterDeclaration), visitNode((<ts.ConstructSignatureDeclaration>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.IndexSignature:
            return ts.updateIndexSignature((<ts.IndexSignatureDeclaration>node), nodesVisitor((<ts.IndexSignatureDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.IndexSignatureDeclaration>node).modifiers, visitor, ts.isModifier), nodesVisitor((<ts.IndexSignatureDeclaration>node).parameters, visitor, ts.isParameterDeclaration), visitNode((<ts.IndexSignatureDeclaration>node).type, visitor, ts.isTypeNode));
        // Types
        case ts.SyntaxKind.TypePredicate:
            return ts.updateTypePredicateNodeWithModifier((<ts.TypePredicateNode>node), visitNode((<ts.TypePredicateNode>node).assertsModifier, visitor), visitNode((<ts.TypePredicateNode>node).parameterName, visitor), visitNode((<ts.TypePredicateNode>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.TypeReference:
            return ts.updateTypeReferenceNode((<ts.TypeReferenceNode>node), visitNode((<ts.TypeReferenceNode>node).typeName, visitor, ts.isEntityName), nodesVisitor((<ts.TypeReferenceNode>node).typeArguments, visitor, ts.isTypeNode));
        case ts.SyntaxKind.FunctionType:
            return ts.updateFunctionTypeNode((<ts.FunctionTypeNode>node), nodesVisitor((<ts.FunctionTypeNode>node).typeParameters, visitor, ts.isTypeParameterDeclaration), nodesVisitor((<ts.FunctionTypeNode>node).parameters, visitor, ts.isParameterDeclaration), visitNode((<ts.FunctionTypeNode>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.ConstructorType:
            return ts.updateConstructorTypeNode((<ts.ConstructorTypeNode>node), nodesVisitor((<ts.ConstructorTypeNode>node).typeParameters, visitor, ts.isTypeParameterDeclaration), nodesVisitor((<ts.ConstructorTypeNode>node).parameters, visitor, ts.isParameterDeclaration), visitNode((<ts.ConstructorTypeNode>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.TypeQuery:
            return ts.updateTypeQueryNode((<ts.TypeQueryNode>node), visitNode((<ts.TypeQueryNode>node).exprName, visitor, ts.isEntityName));
        case ts.SyntaxKind.TypeLiteral:
            return ts.updateTypeLiteralNode((<ts.TypeLiteralNode>node), nodesVisitor((<ts.TypeLiteralNode>node).members, visitor, ts.isTypeElement));
        case ts.SyntaxKind.ArrayType:
            return ts.updateArrayTypeNode((<ts.ArrayTypeNode>node), visitNode((<ts.ArrayTypeNode>node).elementType, visitor, ts.isTypeNode));
        case ts.SyntaxKind.TupleType:
            return ts.updateTupleTypeNode((<ts.TupleTypeNode>node), nodesVisitor((<ts.TupleTypeNode>node).elementTypes, visitor, ts.isTypeNode));
        case ts.SyntaxKind.OptionalType:
            return ts.updateOptionalTypeNode((<ts.OptionalTypeNode>node), visitNode((<ts.OptionalTypeNode>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.RestType:
            return ts.updateRestTypeNode((<ts.RestTypeNode>node), visitNode((<ts.RestTypeNode>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.UnionType:
            return ts.updateUnionTypeNode((<ts.UnionTypeNode>node), nodesVisitor((<ts.UnionTypeNode>node).types, visitor, ts.isTypeNode));
        case ts.SyntaxKind.IntersectionType:
            return ts.updateIntersectionTypeNode((<ts.IntersectionTypeNode>node), nodesVisitor((<ts.IntersectionTypeNode>node).types, visitor, ts.isTypeNode));
        case ts.SyntaxKind.ConditionalType:
            return ts.updateConditionalTypeNode((<ts.ConditionalTypeNode>node), visitNode((<ts.ConditionalTypeNode>node).checkType, visitor, ts.isTypeNode), visitNode((<ts.ConditionalTypeNode>node).extendsType, visitor, ts.isTypeNode), visitNode((<ts.ConditionalTypeNode>node).trueType, visitor, ts.isTypeNode), visitNode((<ts.ConditionalTypeNode>node).falseType, visitor, ts.isTypeNode));
        case ts.SyntaxKind.InferType:
            return ts.updateInferTypeNode((<ts.InferTypeNode>node), visitNode((<ts.InferTypeNode>node).typeParameter, visitor, ts.isTypeParameterDeclaration));
        case ts.SyntaxKind.ImportType:
            return ts.updateImportTypeNode((<ts.ImportTypeNode>node), visitNode((<ts.ImportTypeNode>node).argument, visitor, ts.isTypeNode), visitNode((<ts.ImportTypeNode>node).qualifier, visitor, ts.isEntityName), visitNodes((<ts.ImportTypeNode>node).typeArguments, visitor, ts.isTypeNode), (<ts.ImportTypeNode>node).isTypeOf);
        case ts.SyntaxKind.ParenthesizedType:
            return ts.updateParenthesizedType((<ts.ParenthesizedTypeNode>node), visitNode((<ts.ParenthesizedTypeNode>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.TypeOperator:
            return ts.updateTypeOperatorNode((<ts.TypeOperatorNode>node), visitNode((<ts.TypeOperatorNode>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.IndexedAccessType:
            return ts.updateIndexedAccessTypeNode((<ts.IndexedAccessTypeNode>node), visitNode((<ts.IndexedAccessTypeNode>node).objectType, visitor, ts.isTypeNode), visitNode((<ts.IndexedAccessTypeNode>node).indexType, visitor, ts.isTypeNode));
        case ts.SyntaxKind.MappedType:
            return ts.updateMappedTypeNode((<ts.MappedTypeNode>node), visitNode((<ts.MappedTypeNode>node).readonlyToken, tokenVisitor, ts.isToken), visitNode((<ts.MappedTypeNode>node).typeParameter, visitor, ts.isTypeParameterDeclaration), visitNode((<ts.MappedTypeNode>node).questionToken, tokenVisitor, ts.isToken), visitNode((<ts.MappedTypeNode>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.LiteralType:
            return ts.updateLiteralTypeNode((<ts.LiteralTypeNode>node), visitNode((<ts.LiteralTypeNode>node).literal, visitor, ts.isExpression));
        // Binding patterns
        case ts.SyntaxKind.ObjectBindingPattern:
            return ts.updateObjectBindingPattern((<ts.ObjectBindingPattern>node), nodesVisitor((<ts.ObjectBindingPattern>node).elements, visitor, ts.isBindingElement));
        case ts.SyntaxKind.ArrayBindingPattern:
            return ts.updateArrayBindingPattern((<ts.ArrayBindingPattern>node), nodesVisitor((<ts.ArrayBindingPattern>node).elements, visitor, ts.isArrayBindingElement));
        case ts.SyntaxKind.BindingElement:
            return ts.updateBindingElement((<ts.BindingElement>node), visitNode((<ts.BindingElement>node).dotDotDotToken, tokenVisitor, ts.isToken), visitNode((<ts.BindingElement>node).propertyName, visitor, ts.isPropertyName), visitNode((<ts.BindingElement>node).name, visitor, ts.isBindingName), visitNode((<ts.BindingElement>node).initializer, visitor, ts.isExpression));
        // Expression
        case ts.SyntaxKind.ArrayLiteralExpression:
            return ts.updateArrayLiteral((<ts.ArrayLiteralExpression>node), nodesVisitor((<ts.ArrayLiteralExpression>node).elements, visitor, ts.isExpression));
        case ts.SyntaxKind.ObjectLiteralExpression:
            return ts.updateObjectLiteral((<ts.ObjectLiteralExpression>node), nodesVisitor((<ts.ObjectLiteralExpression>node).properties, visitor, ts.isObjectLiteralElementLike));
        case ts.SyntaxKind.PropertyAccessExpression:
            if (node.flags & ts.NodeFlags.OptionalChain) {
                return ts.updatePropertyAccessChain((<ts.PropertyAccessChain>node), visitNode((<ts.PropertyAccessChain>node).expression, visitor, ts.isExpression), visitNode((<ts.PropertyAccessChain>node).questionDotToken, visitor, ts.isToken), visitNode((<ts.PropertyAccessChain>node).name, visitor, ts.isIdentifier));
            }
            return ts.updatePropertyAccess((<ts.PropertyAccessExpression>node), visitNode((<ts.PropertyAccessExpression>node).expression, visitor, ts.isExpression), visitNode((<ts.PropertyAccessExpression>node).name, visitor, ts.isIdentifier));
        case ts.SyntaxKind.ElementAccessExpression:
            if (node.flags & ts.NodeFlags.OptionalChain) {
                return ts.updateElementAccessChain((<ts.ElementAccessChain>node), visitNode((<ts.ElementAccessChain>node).expression, visitor, ts.isExpression), visitNode((<ts.ElementAccessChain>node).questionDotToken, visitor, ts.isToken), visitNode((<ts.ElementAccessChain>node).argumentExpression, visitor, ts.isExpression));
            }
            return ts.updateElementAccess((<ts.ElementAccessExpression>node), visitNode((<ts.ElementAccessExpression>node).expression, visitor, ts.isExpression), visitNode((<ts.ElementAccessExpression>node).argumentExpression, visitor, ts.isExpression));
        case ts.SyntaxKind.CallExpression:
            if (node.flags & ts.NodeFlags.OptionalChain) {
                return ts.updateCallChain((<ts.CallChain>node), visitNode((<ts.CallChain>node).expression, visitor, ts.isExpression), visitNode((<ts.CallChain>node).questionDotToken, visitor, ts.isToken), nodesVisitor((<ts.CallChain>node).typeArguments, visitor, ts.isTypeNode), nodesVisitor((<ts.CallChain>node).arguments, visitor, ts.isExpression));
            }
            return ts.updateCall((<ts.CallExpression>node), visitNode((<ts.CallExpression>node).expression, visitor, ts.isExpression), nodesVisitor((<ts.CallExpression>node).typeArguments, visitor, ts.isTypeNode), nodesVisitor((<ts.CallExpression>node).arguments, visitor, ts.isExpression));
        case ts.SyntaxKind.NewExpression:
            return ts.updateNew((<ts.NewExpression>node), visitNode((<ts.NewExpression>node).expression, visitor, ts.isExpression), nodesVisitor((<ts.NewExpression>node).typeArguments, visitor, ts.isTypeNode), nodesVisitor((<ts.NewExpression>node).arguments, visitor, ts.isExpression));
        case ts.SyntaxKind.TaggedTemplateExpression:
            return ts.updateTaggedTemplate((<ts.TaggedTemplateExpression>node), visitNode((<ts.TaggedTemplateExpression>node).tag, visitor, ts.isExpression), visitNodes((<ts.TaggedTemplateExpression>node).typeArguments, visitor, ts.isExpression), visitNode((<ts.TaggedTemplateExpression>node).template, visitor, ts.isTemplateLiteral));
        case ts.SyntaxKind.TypeAssertionExpression:
            return ts.updateTypeAssertion((<ts.TypeAssertion>node), visitNode((<ts.TypeAssertion>node).type, visitor, ts.isTypeNode), visitNode((<ts.TypeAssertion>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.ParenthesizedExpression:
            return ts.updateParen((<ts.ParenthesizedExpression>node), visitNode((<ts.ParenthesizedExpression>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.FunctionExpression:
            return ts.updateFunctionExpression((<ts.FunctionExpression>node), nodesVisitor((<ts.FunctionExpression>node).modifiers, visitor, ts.isModifier), visitNode((<ts.FunctionExpression>node).asteriskToken, tokenVisitor, ts.isToken), visitNode((<ts.FunctionExpression>node).name, visitor, ts.isIdentifier), nodesVisitor((<ts.FunctionExpression>node).typeParameters, visitor, ts.isTypeParameterDeclaration), visitParameterList((<ts.FunctionExpression>node).parameters, visitor, context, nodesVisitor), visitNode((<ts.FunctionExpression>node).type, visitor, ts.isTypeNode), visitFunctionBody((<ts.FunctionExpression>node).body, visitor, context));
        case ts.SyntaxKind.ArrowFunction:
            return ts.updateArrowFunction((<ts.ArrowFunction>node), nodesVisitor((<ts.ArrowFunction>node).modifiers, visitor, ts.isModifier), nodesVisitor((<ts.ArrowFunction>node).typeParameters, visitor, ts.isTypeParameterDeclaration), visitParameterList((<ts.ArrowFunction>node).parameters, visitor, context, nodesVisitor), visitNode((<ts.ArrowFunction>node).type, visitor, ts.isTypeNode), visitNode((<ts.ArrowFunction>node).equalsGreaterThanToken, visitor, ts.isToken), visitFunctionBody((<ts.ArrowFunction>node).body, visitor, context));
        case ts.SyntaxKind.DeleteExpression:
            return ts.updateDelete((<ts.DeleteExpression>node), visitNode((<ts.DeleteExpression>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.TypeOfExpression:
            return ts.updateTypeOf((<ts.TypeOfExpression>node), visitNode((<ts.TypeOfExpression>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.VoidExpression:
            return ts.updateVoid((<ts.VoidExpression>node), visitNode((<ts.VoidExpression>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.AwaitExpression:
            return ts.updateAwait((<ts.AwaitExpression>node), visitNode((<ts.AwaitExpression>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.PrefixUnaryExpression:
            return ts.updatePrefix((<ts.PrefixUnaryExpression>node), visitNode((<ts.PrefixUnaryExpression>node).operand, visitor, ts.isExpression));
        case ts.SyntaxKind.PostfixUnaryExpression:
            return ts.updatePostfix((<ts.PostfixUnaryExpression>node), visitNode((<ts.PostfixUnaryExpression>node).operand, visitor, ts.isExpression));
        case ts.SyntaxKind.BinaryExpression:
            return ts.updateBinary((<ts.BinaryExpression>node), visitNode((<ts.BinaryExpression>node).left, visitor, ts.isExpression), visitNode((<ts.BinaryExpression>node).right, visitor, ts.isExpression), visitNode((<ts.BinaryExpression>node).operatorToken, visitor, ts.isToken));
        case ts.SyntaxKind.ConditionalExpression:
            return ts.updateConditional((<ts.ConditionalExpression>node), visitNode((<ts.ConditionalExpression>node).condition, visitor, ts.isExpression), visitNode((<ts.ConditionalExpression>node).questionToken, visitor, ts.isToken), visitNode((<ts.ConditionalExpression>node).whenTrue, visitor, ts.isExpression), visitNode((<ts.ConditionalExpression>node).colonToken, visitor, ts.isToken), visitNode((<ts.ConditionalExpression>node).whenFalse, visitor, ts.isExpression));
        case ts.SyntaxKind.TemplateExpression:
            return ts.updateTemplateExpression((<ts.TemplateExpression>node), visitNode((<ts.TemplateExpression>node).head, visitor, ts.isTemplateHead), nodesVisitor((<ts.TemplateExpression>node).templateSpans, visitor, ts.isTemplateSpan));
        case ts.SyntaxKind.YieldExpression:
            return ts.updateYield((<ts.YieldExpression>node), visitNode((<ts.YieldExpression>node).asteriskToken, tokenVisitor, ts.isToken), visitNode((<ts.YieldExpression>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.SpreadElement:
            return ts.updateSpread((<ts.SpreadElement>node), visitNode((<ts.SpreadElement>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.ClassExpression:
            return ts.updateClassExpression((<ts.ClassExpression>node), nodesVisitor((<ts.ClassExpression>node).modifiers, visitor, ts.isModifier), visitNode((<ts.ClassExpression>node).name, visitor, ts.isIdentifier), nodesVisitor((<ts.ClassExpression>node).typeParameters, visitor, ts.isTypeParameterDeclaration), nodesVisitor((<ts.ClassExpression>node).heritageClauses, visitor, ts.isHeritageClause), nodesVisitor((<ts.ClassExpression>node).members, visitor, ts.isClassElement));
        case ts.SyntaxKind.ExpressionWithTypeArguments:
            return ts.updateExpressionWithTypeArguments((<ts.ExpressionWithTypeArguments>node), nodesVisitor((<ts.ExpressionWithTypeArguments>node).typeArguments, visitor, ts.isTypeNode), visitNode((<ts.ExpressionWithTypeArguments>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.AsExpression:
            return ts.updateAsExpression((<ts.AsExpression>node), visitNode((<ts.AsExpression>node).expression, visitor, ts.isExpression), visitNode((<ts.AsExpression>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.NonNullExpression:
            return ts.updateNonNullExpression((<ts.NonNullExpression>node), visitNode((<ts.NonNullExpression>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.MetaProperty:
            return ts.updateMetaProperty((<ts.MetaProperty>node), visitNode((<ts.MetaProperty>node).name, visitor, ts.isIdentifier));
        // Misc
        case ts.SyntaxKind.TemplateSpan:
            return ts.updateTemplateSpan((<ts.TemplateSpan>node), visitNode((<ts.TemplateSpan>node).expression, visitor, ts.isExpression), visitNode((<ts.TemplateSpan>node).literal, visitor, ts.isTemplateMiddleOrTemplateTail));
        // Element
        case ts.SyntaxKind.Block:
            return ts.updateBlock((<ts.Block>node), nodesVisitor((<ts.Block>node).statements, visitor, ts.isStatement));
        case ts.SyntaxKind.VariableStatement:
            return ts.updateVariableStatement((<ts.VariableStatement>node), nodesVisitor((<ts.VariableStatement>node).modifiers, visitor, ts.isModifier), visitNode((<ts.VariableStatement>node).declarationList, visitor, ts.isVariableDeclarationList));
        case ts.SyntaxKind.ExpressionStatement:
            return ts.updateExpressionStatement((<ts.ExpressionStatement>node), visitNode((<ts.ExpressionStatement>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.IfStatement:
            return ts.updateIf((<ts.IfStatement>node), visitNode((<ts.IfStatement>node).expression, visitor, ts.isExpression), visitNode((<ts.IfStatement>node).thenStatement, visitor, ts.isStatement, ts.liftToBlock), visitNode((<ts.IfStatement>node).elseStatement, visitor, ts.isStatement, ts.liftToBlock));
        case ts.SyntaxKind.DoStatement:
            return ts.updateDo((<ts.DoStatement>node), visitNode((<ts.DoStatement>node).statement, visitor, ts.isStatement, ts.liftToBlock), visitNode((<ts.DoStatement>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.WhileStatement:
            return ts.updateWhile((<ts.WhileStatement>node), visitNode((<ts.WhileStatement>node).expression, visitor, ts.isExpression), visitNode((<ts.WhileStatement>node).statement, visitor, ts.isStatement, ts.liftToBlock));
        case ts.SyntaxKind.ForStatement:
            return ts.updateFor((<ts.ForStatement>node), visitNode((<ts.ForStatement>node).initializer, visitor, ts.isForInitializer), visitNode((<ts.ForStatement>node).condition, visitor, ts.isExpression), visitNode((<ts.ForStatement>node).incrementor, visitor, ts.isExpression), visitNode((<ts.ForStatement>node).statement, visitor, ts.isStatement, ts.liftToBlock));
        case ts.SyntaxKind.ForInStatement:
            return ts.updateForIn((<ts.ForInStatement>node), visitNode((<ts.ForInStatement>node).initializer, visitor, ts.isForInitializer), visitNode((<ts.ForInStatement>node).expression, visitor, ts.isExpression), visitNode((<ts.ForInStatement>node).statement, visitor, ts.isStatement, ts.liftToBlock));
        case ts.SyntaxKind.ForOfStatement:
            return ts.updateForOf((<ts.ForOfStatement>node), visitNode((<ts.ForOfStatement>node).awaitModifier, visitor, ts.isToken), visitNode((<ts.ForOfStatement>node).initializer, visitor, ts.isForInitializer), visitNode((<ts.ForOfStatement>node).expression, visitor, ts.isExpression), visitNode((<ts.ForOfStatement>node).statement, visitor, ts.isStatement, ts.liftToBlock));
        case ts.SyntaxKind.ContinueStatement:
            return ts.updateContinue((<ts.ContinueStatement>node), visitNode((<ts.ContinueStatement>node).label, visitor, ts.isIdentifier));
        case ts.SyntaxKind.BreakStatement:
            return ts.updateBreak((<ts.BreakStatement>node), visitNode((<ts.BreakStatement>node).label, visitor, ts.isIdentifier));
        case ts.SyntaxKind.ReturnStatement:
            return ts.updateReturn((<ts.ReturnStatement>node), visitNode((<ts.ReturnStatement>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.WithStatement:
            return ts.updateWith((<ts.WithStatement>node), visitNode((<ts.WithStatement>node).expression, visitor, ts.isExpression), visitNode((<ts.WithStatement>node).statement, visitor, ts.isStatement, ts.liftToBlock));
        case ts.SyntaxKind.SwitchStatement:
            return ts.updateSwitch((<ts.SwitchStatement>node), visitNode((<ts.SwitchStatement>node).expression, visitor, ts.isExpression), visitNode((<ts.SwitchStatement>node).caseBlock, visitor, ts.isCaseBlock));
        case ts.SyntaxKind.LabeledStatement:
            return ts.updateLabel((<ts.LabeledStatement>node), visitNode((<ts.LabeledStatement>node).label, visitor, ts.isIdentifier), visitNode((<ts.LabeledStatement>node).statement, visitor, ts.isStatement, ts.liftToBlock));
        case ts.SyntaxKind.ThrowStatement:
            return ts.updateThrow((<ts.ThrowStatement>node), visitNode((<ts.ThrowStatement>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.TryStatement:
            return ts.updateTry((<ts.TryStatement>node), visitNode((<ts.TryStatement>node).tryBlock, visitor, ts.isBlock), visitNode((<ts.TryStatement>node).catchClause, visitor, ts.isCatchClause), visitNode((<ts.TryStatement>node).finallyBlock, visitor, ts.isBlock));
        case ts.SyntaxKind.VariableDeclaration:
            return ts.updateTypeScriptVariableDeclaration((<ts.VariableDeclaration>node), visitNode((<ts.VariableDeclaration>node).name, visitor, ts.isBindingName), visitNode((<ts.VariableDeclaration>node).exclamationToken, tokenVisitor, ts.isToken), visitNode((<ts.VariableDeclaration>node).type, visitor, ts.isTypeNode), visitNode((<ts.VariableDeclaration>node).initializer, visitor, ts.isExpression));
        case ts.SyntaxKind.VariableDeclarationList:
            return ts.updateVariableDeclarationList((<ts.VariableDeclarationList>node), nodesVisitor((<ts.VariableDeclarationList>node).declarations, visitor, ts.isVariableDeclaration));
        case ts.SyntaxKind.FunctionDeclaration:
            return ts.updateFunctionDeclaration((<ts.FunctionDeclaration>node), nodesVisitor((<ts.FunctionDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.FunctionDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.FunctionDeclaration>node).asteriskToken, tokenVisitor, ts.isToken), visitNode((<ts.FunctionDeclaration>node).name, visitor, ts.isIdentifier), nodesVisitor((<ts.FunctionDeclaration>node).typeParameters, visitor, ts.isTypeParameterDeclaration), visitParameterList((<ts.FunctionDeclaration>node).parameters, visitor, context, nodesVisitor), visitNode((<ts.FunctionDeclaration>node).type, visitor, ts.isTypeNode), visitFunctionBody((<ts.FunctionExpression>node).body, visitor, context));
        case ts.SyntaxKind.ClassDeclaration:
            return ts.updateClassDeclaration((<ts.ClassDeclaration>node), nodesVisitor((<ts.ClassDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.ClassDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.ClassDeclaration>node).name, visitor, ts.isIdentifier), nodesVisitor((<ts.ClassDeclaration>node).typeParameters, visitor, ts.isTypeParameterDeclaration), nodesVisitor((<ts.ClassDeclaration>node).heritageClauses, visitor, ts.isHeritageClause), nodesVisitor((<ts.ClassDeclaration>node).members, visitor, ts.isClassElement));
        case ts.SyntaxKind.InterfaceDeclaration:
            return ts.updateInterfaceDeclaration((<ts.InterfaceDeclaration>node), nodesVisitor((<ts.InterfaceDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.InterfaceDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.InterfaceDeclaration>node).name, visitor, ts.isIdentifier), nodesVisitor((<ts.InterfaceDeclaration>node).typeParameters, visitor, ts.isTypeParameterDeclaration), nodesVisitor((<ts.InterfaceDeclaration>node).heritageClauses, visitor, ts.isHeritageClause), nodesVisitor((<ts.InterfaceDeclaration>node).members, visitor, ts.isTypeElement));
        case ts.SyntaxKind.TypeAliasDeclaration:
            return ts.updateTypeAliasDeclaration((<ts.TypeAliasDeclaration>node), nodesVisitor((<ts.TypeAliasDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.TypeAliasDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.TypeAliasDeclaration>node).name, visitor, ts.isIdentifier), nodesVisitor((<ts.TypeAliasDeclaration>node).typeParameters, visitor, ts.isTypeParameterDeclaration), visitNode((<ts.TypeAliasDeclaration>node).type, visitor, ts.isTypeNode));
        case ts.SyntaxKind.EnumDeclaration:
            return ts.updateEnumDeclaration((<ts.EnumDeclaration>node), nodesVisitor((<ts.EnumDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.EnumDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.EnumDeclaration>node).name, visitor, ts.isIdentifier), nodesVisitor((<ts.EnumDeclaration>node).members, visitor, ts.isEnumMember));
        case ts.SyntaxKind.ModuleDeclaration:
            return ts.updateModuleDeclaration((<ts.ModuleDeclaration>node), nodesVisitor((<ts.ModuleDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.ModuleDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.ModuleDeclaration>node).name, visitor, ts.isIdentifier), visitNode((<ts.ModuleDeclaration>node).body, visitor, ts.isModuleBody));
        case ts.SyntaxKind.ModuleBlock:
            return ts.updateModuleBlock((<ts.ModuleBlock>node), nodesVisitor((<ts.ModuleBlock>node).statements, visitor, ts.isStatement));
        case ts.SyntaxKind.CaseBlock:
            return ts.updateCaseBlock((<ts.CaseBlock>node), nodesVisitor((<ts.CaseBlock>node).clauses, visitor, ts.isCaseOrDefaultClause));
        case ts.SyntaxKind.NamespaceExportDeclaration:
            return ts.updateNamespaceExportDeclaration((<ts.NamespaceExportDeclaration>node), visitNode((<ts.NamespaceExportDeclaration>node).name, visitor, ts.isIdentifier));
        case ts.SyntaxKind.ImportEqualsDeclaration:
            return ts.updateImportEqualsDeclaration((<ts.ImportEqualsDeclaration>node), nodesVisitor((<ts.ImportEqualsDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.ImportEqualsDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.ImportEqualsDeclaration>node).name, visitor, ts.isIdentifier), visitNode((<ts.ImportEqualsDeclaration>node).moduleReference, visitor, ts.isModuleReference));
        case ts.SyntaxKind.ImportDeclaration:
            return ts.updateImportDeclaration((<ts.ImportDeclaration>node), nodesVisitor((<ts.ImportDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.ImportDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.ImportDeclaration>node).importClause, visitor, ts.isImportClause), visitNode((<ts.ImportDeclaration>node).moduleSpecifier, visitor, ts.isExpression));
        case ts.SyntaxKind.ImportClause:
            return ts.updateImportClause((<ts.ImportClause>node), visitNode((<ts.ImportClause>node).name, visitor, ts.isIdentifier), visitNode((<ts.ImportClause>node).namedBindings, visitor, ts.isNamedImportBindings));
        case ts.SyntaxKind.NamespaceImport:
            return ts.updateNamespaceImport((<ts.NamespaceImport>node), visitNode((<ts.NamespaceImport>node).name, visitor, ts.isIdentifier));
        case ts.SyntaxKind.NamedImports:
            return ts.updateNamedImports((<ts.NamedImports>node), nodesVisitor((<ts.NamedImports>node).elements, visitor, ts.isImportSpecifier));
        case ts.SyntaxKind.ImportSpecifier:
            return ts.updateImportSpecifier((<ts.ImportSpecifier>node), visitNode((<ts.ImportSpecifier>node).propertyName, visitor, ts.isIdentifier), visitNode((<ts.ImportSpecifier>node).name, visitor, ts.isIdentifier));
        case ts.SyntaxKind.ExportAssignment:
            return ts.updateExportAssignment((<ts.ExportAssignment>node), nodesVisitor((<ts.ExportAssignment>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.ExportAssignment>node).modifiers, visitor, ts.isModifier), visitNode((<ts.ExportAssignment>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.ExportDeclaration:
            return ts.updateExportDeclaration((<ts.ExportDeclaration>node), nodesVisitor((<ts.ExportDeclaration>node).decorators, visitor, ts.isDecorator), nodesVisitor((<ts.ExportDeclaration>node).modifiers, visitor, ts.isModifier), visitNode((<ts.ExportDeclaration>node).exportClause, visitor, ts.isNamedExports), visitNode((<ts.ExportDeclaration>node).moduleSpecifier, visitor, ts.isExpression));
        case ts.SyntaxKind.NamedExports:
            return ts.updateNamedExports((<ts.NamedExports>node), nodesVisitor((<ts.NamedExports>node).elements, visitor, ts.isExportSpecifier));
        case ts.SyntaxKind.ExportSpecifier:
            return ts.updateExportSpecifier((<ts.ExportSpecifier>node), visitNode((<ts.ExportSpecifier>node).propertyName, visitor, ts.isIdentifier), visitNode((<ts.ExportSpecifier>node).name, visitor, ts.isIdentifier));
        // Module references
        case ts.SyntaxKind.ExternalModuleReference:
            return ts.updateExternalModuleReference((<ts.ExternalModuleReference>node), visitNode((<ts.ExternalModuleReference>node).expression, visitor, ts.isExpression));
        // JSX
        case ts.SyntaxKind.JsxElement:
            return ts.updateJsxElement((<ts.JsxElement>node), visitNode((<ts.JsxElement>node).openingElement, visitor, ts.isJsxOpeningElement), nodesVisitor((<ts.JsxElement>node).children, visitor, ts.isJsxChild), visitNode((<ts.JsxElement>node).closingElement, visitor, ts.isJsxClosingElement));
        case ts.SyntaxKind.JsxSelfClosingElement:
            return ts.updateJsxSelfClosingElement((<ts.JsxSelfClosingElement>node), visitNode((<ts.JsxSelfClosingElement>node).tagName, visitor, ts.isJsxTagNameExpression), nodesVisitor((<ts.JsxSelfClosingElement>node).typeArguments, visitor, ts.isTypeNode), visitNode((<ts.JsxSelfClosingElement>node).attributes, visitor, ts.isJsxAttributes));
        case ts.SyntaxKind.JsxOpeningElement:
            return ts.updateJsxOpeningElement((<ts.JsxOpeningElement>node), visitNode((<ts.JsxOpeningElement>node).tagName, visitor, ts.isJsxTagNameExpression), nodesVisitor((<ts.JsxSelfClosingElement>node).typeArguments, visitor, ts.isTypeNode), visitNode((<ts.JsxOpeningElement>node).attributes, visitor, ts.isJsxAttributes));
        case ts.SyntaxKind.JsxClosingElement:
            return ts.updateJsxClosingElement((<ts.JsxClosingElement>node), visitNode((<ts.JsxClosingElement>node).tagName, visitor, ts.isJsxTagNameExpression));
        case ts.SyntaxKind.JsxFragment:
            return ts.updateJsxFragment((<ts.JsxFragment>node), visitNode((<ts.JsxFragment>node).openingFragment, visitor, ts.isJsxOpeningFragment), nodesVisitor((<ts.JsxFragment>node).children, visitor, ts.isJsxChild), visitNode((<ts.JsxFragment>node).closingFragment, visitor, ts.isJsxClosingFragment));
        case ts.SyntaxKind.JsxAttribute:
            return ts.updateJsxAttribute((<ts.JsxAttribute>node), visitNode((<ts.JsxAttribute>node).name, visitor, ts.isIdentifier), visitNode((<ts.JsxAttribute>node).initializer, visitor, ts.isStringLiteralOrJsxExpression));
        case ts.SyntaxKind.JsxAttributes:
            return ts.updateJsxAttributes((<ts.JsxAttributes>node), nodesVisitor((<ts.JsxAttributes>node).properties, visitor, ts.isJsxAttributeLike));
        case ts.SyntaxKind.JsxSpreadAttribute:
            return ts.updateJsxSpreadAttribute((<ts.JsxSpreadAttribute>node), visitNode((<ts.JsxSpreadAttribute>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.JsxExpression:
            return ts.updateJsxExpression((<ts.JsxExpression>node), visitNode((<ts.JsxExpression>node).expression, visitor, ts.isExpression));
        // Clauses
        case ts.SyntaxKind.CaseClause:
            return ts.updateCaseClause((<ts.CaseClause>node), visitNode((<ts.CaseClause>node).expression, visitor, ts.isExpression), nodesVisitor((<ts.CaseClause>node).statements, visitor, ts.isStatement));
        case ts.SyntaxKind.DefaultClause:
            return ts.updateDefaultClause((<ts.DefaultClause>node), nodesVisitor((<ts.DefaultClause>node).statements, visitor, ts.isStatement));
        case ts.SyntaxKind.HeritageClause:
            return ts.updateHeritageClause((<ts.HeritageClause>node), nodesVisitor((<ts.HeritageClause>node).types, visitor, ts.isExpressionWithTypeArguments));
        case ts.SyntaxKind.CatchClause:
            return ts.updateCatchClause((<ts.CatchClause>node), visitNode((<ts.CatchClause>node).variableDeclaration, visitor, ts.isVariableDeclaration), visitNode((<ts.CatchClause>node).block, visitor, ts.isBlock));
        // Property assignments
        case ts.SyntaxKind.PropertyAssignment:
            return ts.updatePropertyAssignment((<ts.PropertyAssignment>node), visitNode((<ts.PropertyAssignment>node).name, visitor, ts.isPropertyName), visitNode((<ts.PropertyAssignment>node).initializer, visitor, ts.isExpression));
        case ts.SyntaxKind.ShorthandPropertyAssignment:
            return ts.updateShorthandPropertyAssignment((<ts.ShorthandPropertyAssignment>node), visitNode((<ts.ShorthandPropertyAssignment>node).name, visitor, ts.isIdentifier), visitNode((<ts.ShorthandPropertyAssignment>node).objectAssignmentInitializer, visitor, ts.isExpression));
        case ts.SyntaxKind.SpreadAssignment:
            return ts.updateSpreadAssignment((<ts.SpreadAssignment>node), visitNode((<ts.SpreadAssignment>node).expression, visitor, ts.isExpression));
        // Enum
        case ts.SyntaxKind.EnumMember:
            return ts.updateEnumMember((<ts.EnumMember>node), visitNode((<ts.EnumMember>node).name, visitor, ts.isPropertyName), visitNode((<ts.EnumMember>node).initializer, visitor, ts.isExpression));
        // Top-level nodes
        case ts.SyntaxKind.SourceFile:
            return ts.updateSourceFileNode((<ts.SourceFile>node), visitLexicalEnvironment((<ts.SourceFile>node).statements, visitor, context));
        // Transformation nodes
        case ts.SyntaxKind.PartiallyEmittedExpression:
            return ts.updatePartiallyEmittedExpression((<ts.PartiallyEmittedExpression>node), visitNode((<ts.PartiallyEmittedExpression>node).expression, visitor, ts.isExpression));
        case ts.SyntaxKind.CommaListExpression:
            return ts.updateCommaList((<ts.CommaListExpression>node), nodesVisitor((<ts.CommaListExpression>node).elements, visitor, ts.isExpression));
        default:
            // No need to visit nodes with no children.
            return node;
    }
}
/**
 * Extracts the single node from a NodeArray.
 *
 * @param nodes The NodeArray.
 */
function extractSingleNode(nodes: readonly ts.Node[]): ts.Node | undefined {
    ts.Debug.assert(nodes.length <= 1, "Too many nodes written to output.");
    return ts.singleOrUndefined(nodes);
}

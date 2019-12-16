import * as ts from "./ts";
/* @internal */
/**
 * Matches all whitespace characters in a string. Eg:
 *
 * "app.
 *
 * onactivated"
 *
 * matches because of the newline, whereas
 *
 * "app.onactivated"
 *
 * does not match.
 */
const whiteSpaceRegex = /\s+/g;
/**
 * Maximum amount of characters to return
 * The amount was choosen arbitrarily.
 */
/* @internal */
const maxLength = 150;
// Keep sourceFile handy so we don't have to search for it every time we need to call `getText`.
/* @internal */
let curCancellationToken: ts.CancellationToken;
/* @internal */
let curSourceFile: ts.SourceFile;
/**
 * For performance, we keep navigation bar parents on a stack rather than passing them through each recursion.
 * `parent` is the current parent and is *not* stored in parentsStack.
 * `startNode` sets a new parent and `endNode` returns to the previous parent.
 */
/* @internal */
let parentsStack: NavigationBarNode[] = [];
/* @internal */
let parent: NavigationBarNode;
/* @internal */
const trackedEs5ClassesStack: (ts.Map<boolean> | undefined)[] = [];
/* @internal */
let trackedEs5Classes: ts.Map<boolean> | undefined;
// NavigationBarItem requires an array, but will not mutate it, so just give it this for performance.
/* @internal */
let emptyChildItemArray: ts.NavigationBarItem[] = [];
/**
 * Represents a navigation bar item and its children.
 * The returned NavigationBarItem is more complicated and doesn't include 'parent', so we use these to do work before converting.
 */
/* @internal */
interface NavigationBarNode {
    node: ts.Node;
    name: ts.DeclarationName | undefined;
    additionalNodes: ts.Node[] | undefined;
    parent: NavigationBarNode | undefined; // Present for all but root node
    children: NavigationBarNode[] | undefined;
    indent: number; // # of parents
}
/* @internal */
export function getNavigationBarItems(sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken): ts.NavigationBarItem[] {
    curCancellationToken = cancellationToken;
    curSourceFile = sourceFile;
    try {
        return ts.map(primaryNavBarMenuItems(rootNavigationBarNode(sourceFile)), convertToPrimaryNavBarMenuItem);
    }
    finally {
        reset();
    }
}
/* @internal */
export function getNavigationTree(sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken): ts.NavigationTree {
    curCancellationToken = cancellationToken;
    curSourceFile = sourceFile;
    try {
        return convertToTree(rootNavigationBarNode(sourceFile));
    }
    finally {
        reset();
    }
}
/* @internal */
function reset() {
    curSourceFile = undefined!;
    curCancellationToken = undefined!;
    parentsStack = [];
    parent = undefined!;
    emptyChildItemArray = [];
}
/* @internal */
function nodeText(node: ts.Node): string {
    return cleanText(node.getText(curSourceFile));
}
/* @internal */
function navigationBarNodeKind(n: NavigationBarNode): ts.SyntaxKind {
    return n.node.kind;
}
/* @internal */
function pushChild(parent: NavigationBarNode, child: NavigationBarNode): void {
    if (parent.children) {
        parent.children.push(child);
    }
    else {
        parent.children = [child];
    }
}
/* @internal */
function rootNavigationBarNode(sourceFile: ts.SourceFile): NavigationBarNode {
    ts.Debug.assert(!parentsStack.length);
    const root: NavigationBarNode = { node: sourceFile, name: undefined, additionalNodes: undefined, parent: undefined, children: undefined, indent: 0 };
    parent = root;
    for (const statement of sourceFile.statements) {
        addChildrenRecursively(statement);
    }
    endNode();
    ts.Debug.assert(!parent && !parentsStack.length);
    return root;
}
/* @internal */
function addLeafNode(node: ts.Node, name?: ts.DeclarationName): void {
    pushChild(parent, emptyNavigationBarNode(node, name));
}
/* @internal */
function emptyNavigationBarNode(node: ts.Node, name?: ts.DeclarationName): NavigationBarNode {
    return {
        node,
        name: name || (ts.isDeclaration(node) || ts.isExpression(node) ? ts.getNameOfDeclaration(node) : undefined),
        additionalNodes: undefined,
        parent,
        children: undefined,
        indent: parent.indent + 1
    };
}
/* @internal */
function addTrackedEs5Class(name: string) {
    if (!trackedEs5Classes) {
        trackedEs5Classes = ts.createMap();
    }
    trackedEs5Classes.set(name, true);
}
/* @internal */
function endNestedNodes(depth: number): void {
    for (let i = 0; i < depth; i++)
        endNode();
}
/* @internal */
function startNestedNodes(targetNode: ts.Node, entityName: ts.BindableStaticNameExpression) {
    const names: (ts.PropertyNameLiteral | ts.WellKnownSymbolExpression)[] = [];
    while (!ts.isPropertyNameLiteral(entityName)) {
        const name = ts.getNameOrArgument(entityName);
        const nameText = ts.getElementOrPropertyAccessName(entityName);
        entityName = entityName.expression;
        if (nameText === "prototype")
            continue;
        names.push(name);
    }
    names.push(entityName);
    for (let i = names.length - 1; i > 0; i--) {
        const name = names[i];
        startNode(targetNode, name);
    }
    return [names.length - 1, names[0]] as const;
}
/**
 * Add a new level of NavigationBarNodes.
 * This pushes to the stack, so you must call `endNode` when you are done adding to this node.
 */
/* @internal */
function startNode(node: ts.Node, name?: ts.DeclarationName): void {
    const navNode: NavigationBarNode = emptyNavigationBarNode(node, name);
    pushChild(parent, navNode);
    // Save the old parent
    parentsStack.push(parent);
    trackedEs5ClassesStack.push(trackedEs5Classes);
    parent = navNode;
}
/** Call after calling `startNode` and adding children to it. */
/* @internal */
function endNode(): void {
    if (parent.children) {
        mergeChildren(parent.children, parent);
        sortChildren(parent.children);
    }
    parent = parentsStack.pop()!;
    trackedEs5Classes = trackedEs5ClassesStack.pop();
}
/* @internal */
function addNodeWithRecursiveChild(node: ts.Node, child: ts.Node | undefined, name?: ts.DeclarationName): void {
    startNode(node, name);
    addChildrenRecursively(child);
    endNode();
}
/** Look for navigation bar items in node's subtree, adding them to the current `parent`. */
/* @internal */
function addChildrenRecursively(node: ts.Node | undefined): void {
    curCancellationToken.throwIfCancellationRequested();
    if (!node || ts.isToken(node)) {
        return;
    }
    switch (node.kind) {
        case ts.SyntaxKind.Constructor:
            // Get parameter properties, and treat them as being on the *same* level as the constructor, not under it.
            const ctr = (<ts.ConstructorDeclaration>node);
            addNodeWithRecursiveChild(ctr, ctr.body);
            // Parameter properties are children of the class, not the constructor.
            for (const param of ctr.parameters) {
                if (ts.isParameterPropertyDeclaration(param, ctr)) {
                    addLeafNode(param);
                }
            }
            break;
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
        case ts.SyntaxKind.MethodSignature:
            if (!ts.hasDynamicName((<ts.ClassElement | ts.TypeElement>node))) {
                addNodeWithRecursiveChild(node, (<ts.FunctionLikeDeclaration>node).body);
            }
            break;
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.PropertySignature:
            if (!ts.hasDynamicName((<ts.ClassElement | ts.TypeElement>node))) {
                addLeafNode(node);
            }
            break;
        case ts.SyntaxKind.ImportClause:
            const importClause = (<ts.ImportClause>node);
            // Handle default import case e.g.:
            //    import d from "mod";
            if (importClause.name) {
                addLeafNode(importClause.name);
            }
            // Handle named bindings in imports e.g.:
            //    import * as NS from "mod";
            //    import {a, b as B} from "mod";
            const { namedBindings } = importClause;
            if (namedBindings) {
                if (namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
                    addLeafNode(namedBindings);
                }
                else {
                    for (const element of namedBindings.elements) {
                        addLeafNode(element);
                    }
                }
            }
            break;
        case ts.SyntaxKind.ShorthandPropertyAssignment:
            addNodeWithRecursiveChild(node, (<ts.ShorthandPropertyAssignment>node).name);
            break;
        case ts.SyntaxKind.SpreadAssignment:
            const { expression } = (<ts.SpreadAssignment>node);
            // Use the expression as the name of the SpreadAssignment, otherwise show as <unknown>.
            ts.isIdentifier(expression) ? addLeafNode(node, expression) : addLeafNode(node);
            break;
        case ts.SyntaxKind.BindingElement:
        case ts.SyntaxKind.PropertyAssignment:
        case ts.SyntaxKind.VariableDeclaration:
            const { name, initializer } = (<ts.VariableDeclaration | ts.PropertyAssignment | ts.BindingElement>node);
            if (ts.isBindingPattern(name)) {
                addChildrenRecursively(name);
            }
            else if (initializer && isFunctionOrClassExpression(initializer)) {
                // Add a node for the VariableDeclaration, but not for the initializer.
                startNode(node);
                ts.forEachChild(initializer, addChildrenRecursively);
                endNode();
            }
            else {
                addNodeWithRecursiveChild(node, initializer);
            }
            break;
        case ts.SyntaxKind.FunctionDeclaration:
            const nameNode = (<ts.FunctionLikeDeclaration>node).name;
            // If we see a function declaration track as a possible ES5 class
            if (nameNode && ts.isIdentifier(nameNode)) {
                addTrackedEs5Class(nameNode.text);
            }
            addNodeWithRecursiveChild(node, (<ts.FunctionLikeDeclaration>node).body);
            break;
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.FunctionExpression:
            addNodeWithRecursiveChild(node, (<ts.FunctionLikeDeclaration>node).body);
            break;
        case ts.SyntaxKind.EnumDeclaration:
            startNode(node);
            for (const member of (<ts.EnumDeclaration>node).members) {
                if (!isComputedProperty(member)) {
                    addLeafNode(member);
                }
            }
            endNode();
            break;
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.ClassExpression:
        case ts.SyntaxKind.InterfaceDeclaration:
            startNode(node);
            for (const member of (<ts.InterfaceDeclaration>node).members) {
                addChildrenRecursively(member);
            }
            endNode();
            break;
        case ts.SyntaxKind.ModuleDeclaration:
            addNodeWithRecursiveChild(node, getInteriorModule((<ts.ModuleDeclaration>node)).body);
            break;
        case ts.SyntaxKind.ExportSpecifier:
        case ts.SyntaxKind.ImportEqualsDeclaration:
        case ts.SyntaxKind.IndexSignature:
        case ts.SyntaxKind.CallSignature:
        case ts.SyntaxKind.ConstructSignature:
        case ts.SyntaxKind.TypeAliasDeclaration:
            addLeafNode(node);
            break;
        case ts.SyntaxKind.CallExpression:
        case ts.SyntaxKind.BinaryExpression: {
            const special = ts.getAssignmentDeclarationKind((node as ts.BinaryExpression));
            switch (special) {
                case ts.AssignmentDeclarationKind.ExportsProperty:
                case ts.AssignmentDeclarationKind.ModuleExports:
                    addNodeWithRecursiveChild(node, (node as ts.BinaryExpression).right);
                    return;
                case ts.AssignmentDeclarationKind.Prototype:
                case ts.AssignmentDeclarationKind.PrototypeProperty: {
                    const binaryExpression = (node as ts.BinaryExpression);
                    const assignmentTarget = (binaryExpression.left as ts.PropertyAccessExpression);
                    const prototypeAccess = special === ts.AssignmentDeclarationKind.PrototypeProperty ?
                        assignmentTarget.expression as ts.PropertyAccessExpression :
                        assignmentTarget;
                    let depth = 0;
                    let className: ts.PropertyNameLiteral | ts.WellKnownSymbolExpression;
                    // If we see a prototype assignment, start tracking the target as a class
                    // This is only done for simple classes not nested assignments.
                    if (ts.isIdentifier(prototypeAccess.expression)) {
                        addTrackedEs5Class(prototypeAccess.expression.text);
                        className = prototypeAccess.expression;
                    }
                    else {
                        [depth, className] = startNestedNodes(binaryExpression, (prototypeAccess.expression as ts.EntityNameExpression));
                    }
                    if (special === ts.AssignmentDeclarationKind.Prototype) {
                        if (ts.isObjectLiteralExpression(binaryExpression.right)) {
                            if (binaryExpression.right.properties.length > 0) {
                                startNode(binaryExpression, className);
                                ts.forEachChild(binaryExpression.right, addChildrenRecursively);
                                endNode();
                            }
                        }
                    }
                    else if (ts.isFunctionExpression(binaryExpression.right) || ts.isArrowFunction(binaryExpression.right)) {
                        addNodeWithRecursiveChild(node, binaryExpression.right, className);
                    }
                    else {
                        startNode(binaryExpression, className);
                        addNodeWithRecursiveChild(node, binaryExpression.right, assignmentTarget.name);
                        endNode();
                    }
                    endNestedNodes(depth);
                    return;
                }
                case ts.AssignmentDeclarationKind.ObjectDefinePropertyValue:
                case ts.AssignmentDeclarationKind.ObjectDefinePrototypeProperty: {
                    const defineCall = (node as ts.BindableObjectDefinePropertyCall);
                    const className = special === ts.AssignmentDeclarationKind.ObjectDefinePropertyValue ?
                        defineCall.arguments[0] :
                        (defineCall.arguments[0] as ts.PropertyAccessExpression).expression as ts.EntityNameExpression;
                    const memberName = defineCall.arguments[1];
                    const [depth, classNameIdentifier] = startNestedNodes(node, className);
                    startNode(node, classNameIdentifier);
                    startNode(node, ts.setTextRange(ts.createIdentifier(memberName.text), memberName));
                    addChildrenRecursively((node as ts.CallExpression).arguments[2]);
                    endNode();
                    endNode();
                    endNestedNodes(depth);
                    return;
                }
                case ts.AssignmentDeclarationKind.Property: {
                    const binaryExpression = (node as ts.BinaryExpression);
                    const assignmentTarget = (binaryExpression.left as ts.PropertyAccessExpression | ts.BindableElementAccessExpression);
                    const targetFunction = assignmentTarget.expression;
                    if (ts.isIdentifier(targetFunction) && ts.getElementOrPropertyAccessName(assignmentTarget) !== "prototype" &&
                        trackedEs5Classes && trackedEs5Classes.has(targetFunction.text)) {
                        if (ts.isFunctionExpression(binaryExpression.right) || ts.isArrowFunction(binaryExpression.right)) {
                            addNodeWithRecursiveChild(node, binaryExpression.right, targetFunction);
                        }
                        else if (ts.isBindableStaticAccessExpression(assignmentTarget)) {
                            startNode(binaryExpression, targetFunction);
                            addNodeWithRecursiveChild(binaryExpression.left, binaryExpression.right, ts.getNameOrArgument(assignmentTarget));
                            endNode();
                        }
                        return;
                    }
                    break;
                }
                case ts.AssignmentDeclarationKind.ThisProperty:
                case ts.AssignmentDeclarationKind.None:
                case ts.AssignmentDeclarationKind.ObjectDefinePropertyExports:
                    break;
                default:
                    ts.Debug.assertNever(special);
            }
        }
        // falls through
        default:
            if (ts.hasJSDocNodes(node)) {
                ts.forEach(node.jsDoc, jsDoc => {
                    ts.forEach(jsDoc.tags, tag => {
                        if (ts.isJSDocTypeAlias(tag)) {
                            addLeafNode(tag);
                        }
                    });
                });
            }
            ts.forEachChild(node, addChildrenRecursively);
    }
}
/** Merge declarations of the same kind. */
/* @internal */
function mergeChildren(children: NavigationBarNode[], node: NavigationBarNode): void {
    const nameToItems = ts.createMap<NavigationBarNode | NavigationBarNode[]>();
    ts.filterMutate(children, (child, index) => {
        const declName = child.name || ts.getNameOfDeclaration((<ts.Declaration>child.node));
        const name = declName && nodeText(declName);
        if (!name) {
            // Anonymous items are never merged.
            return true;
        }
        const itemsWithSameName = nameToItems.get(name);
        if (!itemsWithSameName) {
            nameToItems.set(name, child);
            return true;
        }
        if (itemsWithSameName instanceof Array) {
            for (const itemWithSameName of itemsWithSameName) {
                if (tryMerge(itemWithSameName, child, index, node)) {
                    return false;
                }
            }
            itemsWithSameName.push(child);
            return true;
        }
        else {
            const itemWithSameName = itemsWithSameName;
            if (tryMerge(itemWithSameName, child, index, node)) {
                return false;
            }
            nameToItems.set(name, [itemWithSameName, child]);
            return true;
        }
    });
}
/* @internal */
const isEs5ClassMember: Record<ts.AssignmentDeclarationKind, boolean> = {
    [ts.AssignmentDeclarationKind.Property]: true,
    [ts.AssignmentDeclarationKind.PrototypeProperty]: true,
    [ts.AssignmentDeclarationKind.ObjectDefinePropertyValue]: true,
    [ts.AssignmentDeclarationKind.ObjectDefinePrototypeProperty]: true,
    [ts.AssignmentDeclarationKind.None]: false,
    [ts.AssignmentDeclarationKind.ExportsProperty]: false,
    [ts.AssignmentDeclarationKind.ModuleExports]: false,
    [ts.AssignmentDeclarationKind.ObjectDefinePropertyExports]: false,
    [ts.AssignmentDeclarationKind.Prototype]: true,
    [ts.AssignmentDeclarationKind.ThisProperty]: false,
};
/* @internal */
function tryMergeEs5Class(a: NavigationBarNode, b: NavigationBarNode, bIndex: number, parent: NavigationBarNode): boolean | undefined {
    function isPossibleConstructor(node: ts.Node) {
        return ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node);
    }
    const bAssignmentDeclarationKind = ts.isBinaryExpression(b.node) || ts.isCallExpression(b.node) ?
        ts.getAssignmentDeclarationKind(b.node) :
        ts.AssignmentDeclarationKind.None;
    const aAssignmentDeclarationKind = ts.isBinaryExpression(a.node) || ts.isCallExpression(a.node) ?
        ts.getAssignmentDeclarationKind(a.node) :
        ts.AssignmentDeclarationKind.None;
    // We treat this as an es5 class and merge the nodes in in one of several cases
    if ((isEs5ClassMember[bAssignmentDeclarationKind] && isEs5ClassMember[aAssignmentDeclarationKind]) // merge two class elements
        || (isPossibleConstructor(a.node) && isEs5ClassMember[bAssignmentDeclarationKind]) // ctor function & member
        || (isPossibleConstructor(b.node) && isEs5ClassMember[aAssignmentDeclarationKind]) // member & ctor function
        || (ts.isClassDeclaration(a.node) && isEs5ClassMember[bAssignmentDeclarationKind]) // class (generated) & member
        || (ts.isClassDeclaration(b.node) && isEs5ClassMember[aAssignmentDeclarationKind]) // member & class (generated)
        || (ts.isClassDeclaration(a.node) && isPossibleConstructor(b.node)) // class (generated) & ctor
        || (ts.isClassDeclaration(b.node) && isPossibleConstructor(a.node)) // ctor & class (generated)
    ) {
        let lastANode = a.additionalNodes && ts.lastOrUndefined(a.additionalNodes) || a.node;
        if ((!ts.isClassDeclaration(a.node) && !ts.isClassDeclaration(b.node)) // If neither outline node is a class
            || isPossibleConstructor(a.node) || isPossibleConstructor(b.node) // If either function is a constructor function
        ) {
            const ctorFunction = isPossibleConstructor(a.node) ? a.node :
                isPossibleConstructor(b.node) ? b.node :
                    undefined;
            if (ctorFunction !== undefined) {
                const ctorNode = ts.setTextRange(ts.createConstructor(/* decorators */ undefined, /* modifiers */ undefined, [], /* body */ undefined), ctorFunction);
                const ctor = emptyNavigationBarNode(ctorNode);
                ctor.indent = a.indent + 1;
                ctor.children = a.node === ctorFunction ? a.children : b.children;
                a.children = a.node === ctorFunction ? ts.concatenate([ctor], b.children || [b]) : ts.concatenate(a.children || [a], [ctor]);
            }
            else {
                if (a.children || b.children) {
                    a.children = ts.concatenate(a.children || [a], b.children || [b]);
                    if (a.children) {
                        mergeChildren(a.children, a);
                        sortChildren(a.children);
                    }
                }
            }
            lastANode = a.node = ts.setTextRange(ts.createClassDeclaration(
            /* decorators */ undefined, 
            /* modifiers */ undefined, (a.name as ts.Identifier) || ts.createIdentifier("__class__"), 
            /* typeParameters */ undefined, 
            /* heritageClauses */ undefined, []), a.node);
        }
        else {
            a.children = ts.concatenate(a.children, b.children);
            if (a.children) {
                mergeChildren(a.children, a);
            }
        }
        const bNode = b.node;
        // We merge if the outline node previous to b (bIndex - 1) is already part of the current class
        // We do this so that statements between class members that do not generate outline nodes do not split up the class outline:
        // Ex This should produce one outline node C:
        //    function C() {}; a = 1; C.prototype.m = function () {}
        // Ex This will produce 3 outline nodes: C, a, C
        //    function C() {}; let a = 1; C.prototype.m = function () {}
        if (parent.children![bIndex - 1].node.end === lastANode.end) {
            ts.setTextRange(lastANode, { pos: lastANode.pos, end: bNode.end });
        }
        else {
            if (!a.additionalNodes)
                a.additionalNodes = [];
            a.additionalNodes.push(ts.setTextRange(ts.createClassDeclaration(
            /* decorators */ undefined, 
            /* modifiers */ undefined, (a.name as ts.Identifier) || ts.createIdentifier("__class__"), 
            /* typeParameters */ undefined, 
            /* heritageClauses */ undefined, []), b.node));
        }
        return true;
    }
    return bAssignmentDeclarationKind === ts.AssignmentDeclarationKind.None ? false : true;
}
/* @internal */
function tryMerge(a: NavigationBarNode, b: NavigationBarNode, bIndex: number, parent: NavigationBarNode): boolean {
    // const v = false as boolean;
    if (tryMergeEs5Class(a, b, bIndex, parent)) {
        return true;
    }
    if (shouldReallyMerge(a.node, b.node, parent)) {
        merge(a, b);
        return true;
    }
    return false;
}
/** a and b have the same name, but they may not be mergeable. */
/* @internal */
function shouldReallyMerge(a: ts.Node, b: ts.Node, parent: NavigationBarNode): boolean {
    if (a.kind !== b.kind || a.parent !== b.parent && !(isOwnChild(a, parent) && isOwnChild(b, parent))) {
        return false;
    }
    switch (a.kind) {
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
            return ts.hasModifier(a, ts.ModifierFlags.Static) === ts.hasModifier(b, ts.ModifierFlags.Static);
        case ts.SyntaxKind.ModuleDeclaration:
            return areSameModule((<ts.ModuleDeclaration>a), (<ts.ModuleDeclaration>b));
        default:
            return true;
    }
}
// We want to merge own children like `I` in in `module A { interface I {} } module A { interface I {} }`
// We don't want to merge unrelated children like `m` in `const o = { a: { m() {} }, b: { m() {} } };`
/* @internal */
function isOwnChild(n: ts.Node, parent: NavigationBarNode): boolean {
    const par = ts.isModuleBlock(n.parent) ? n.parent.parent : n.parent;
    return par === parent.node || ts.contains(parent.additionalNodes, par);
}
// We use 1 NavNode to represent 'A.B.C', but there are multiple source nodes.
// Only merge module nodes that have the same chain. Don't merge 'A.B.C' with 'A'!
/* @internal */
function areSameModule(a: ts.ModuleDeclaration, b: ts.ModuleDeclaration): boolean {
    // TODO: GH#18217
    return a.body!.kind === b.body!.kind && (a.body!.kind !== ts.SyntaxKind.ModuleDeclaration || areSameModule((<ts.ModuleDeclaration>a.body), (<ts.ModuleDeclaration>b.body)));
}
/** Merge source into target. Source should be thrown away after this is called. */
/* @internal */
function merge(target: NavigationBarNode, source: NavigationBarNode): void {
    target.additionalNodes = target.additionalNodes || [];
    target.additionalNodes.push(source.node);
    if (source.additionalNodes) {
        target.additionalNodes.push(...source.additionalNodes);
    }
    target.children = ts.concatenate(target.children, source.children);
    if (target.children) {
        mergeChildren(target.children, target);
        sortChildren(target.children);
    }
}
/** Recursively ensure that each NavNode's children are in sorted order. */
/* @internal */
function sortChildren(children: NavigationBarNode[]): void {
    children.sort(compareChildren);
}
/* @internal */
function compareChildren(child1: NavigationBarNode, child2: NavigationBarNode) {
    return ts.compareStringsCaseSensitiveUI((tryGetName(child1.node)!), (tryGetName(child2.node)!)) // TODO: GH#18217
        || ts.compareValues(navigationBarNodeKind(child1), navigationBarNodeKind(child2));
}
/**
 * This differs from getItemName because this is just used for sorting.
 * We only sort nodes by name that have a more-or-less "direct" name, as opposed to `new()` and the like.
 * So `new()` can still come before an `aardvark` method.
 */
/* @internal */
function tryGetName(node: ts.Node): string | undefined {
    if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
        return getModuleName((<ts.ModuleDeclaration>node));
    }
    const declName = ts.getNameOfDeclaration((<ts.Declaration>node));
    if (declName && ts.isPropertyName(declName)) {
        const propertyName = ts.getPropertyNameForPropertyNameNode(declName);
        return propertyName && ts.unescapeLeadingUnderscores(propertyName);
    }
    switch (node.kind) {
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.ClassExpression:
            return getFunctionOrClassName((<ts.FunctionExpression | ts.ArrowFunction | ts.ClassExpression>node));
        default:
            return undefined;
    }
}
/* @internal */
function getItemName(node: ts.Node, name: ts.Node | undefined): string {
    if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
        return cleanText(getModuleName((<ts.ModuleDeclaration>node)));
    }
    if (name) {
        const text = ts.isIdentifier(name) ? name.text
            : ts.isElementAccessExpression(name) ? `[${nodeText(name.argumentExpression)}]`
                : nodeText(name);
        if (text.length > 0) {
            return cleanText(text);
        }
    }
    switch (node.kind) {
        case ts.SyntaxKind.SourceFile:
            const sourceFile = (<ts.SourceFile>node);
            return ts.isExternalModule(sourceFile)
                ? `"${ts.escapeString(ts.getBaseFileName(ts.removeFileExtension(ts.normalizePath(sourceFile.fileName))))}"`
                : "<global>";
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.ClassExpression:
            if (ts.getModifierFlags(node) & ts.ModifierFlags.Default) {
                return "default";
            }
            // We may get a string with newlines or other whitespace in the case of an object dereference
            // (eg: "app\n.onactivated"), so we should remove the whitespace for readabiltiy in the
            // navigation bar.
            return getFunctionOrClassName((<ts.ArrowFunction | ts.FunctionExpression | ts.ClassExpression>node));
        case ts.SyntaxKind.Constructor:
            return "constructor";
        case ts.SyntaxKind.ConstructSignature:
            return "new()";
        case ts.SyntaxKind.CallSignature:
            return "()";
        case ts.SyntaxKind.IndexSignature:
            return "[]";
        default:
            return "<unknown>";
    }
}
/** Flattens the NavNode tree to a list of items to appear in the primary navbar menu. */
/* @internal */
function primaryNavBarMenuItems(root: NavigationBarNode): NavigationBarNode[] {
    // The primary (middle) navbar menu displays the general code navigation hierarchy, similar to the navtree.
    // The secondary (right) navbar menu displays the child items of whichever primary item is selected.
    // Some less interesting items without their own child navigation items (e.g. a local variable declaration) only show up in the secondary menu.
    const primaryNavBarMenuItems: NavigationBarNode[] = [];
    function recur(item: NavigationBarNode) {
        if (shouldAppearInPrimaryNavBarMenu(item)) {
            primaryNavBarMenuItems.push(item);
            if (item.children) {
                for (const child of item.children) {
                    recur(child);
                }
            }
        }
    }
    recur(root);
    return primaryNavBarMenuItems;
    /** Determines if a node should appear in the primary navbar menu. */
    function shouldAppearInPrimaryNavBarMenu(item: NavigationBarNode): boolean {
        // Items with children should always appear in the primary navbar menu.
        if (item.children) {
            return true;
        }
        // Some nodes are otherwise important enough to always include in the primary navigation menu.
        switch (navigationBarNodeKind(item)) {
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.SourceFile:
            case ts.SyntaxKind.TypeAliasDeclaration:
            case ts.SyntaxKind.JSDocTypedefTag:
            case ts.SyntaxKind.JSDocCallbackTag:
                return true;
            case ts.SyntaxKind.ArrowFunction:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
                return isTopLevelFunctionDeclaration(item);
            default:
                return false;
        }
        function isTopLevelFunctionDeclaration(item: NavigationBarNode): boolean {
            if (!(<ts.FunctionDeclaration>item.node).body) {
                return false;
            }
            switch (navigationBarNodeKind(item.parent!)) {
                case ts.SyntaxKind.ModuleBlock:
                case ts.SyntaxKind.SourceFile:
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.Constructor:
                    return true;
                default:
                    return false;
            }
        }
    }
}
/* @internal */
function convertToTree(n: NavigationBarNode): ts.NavigationTree {
    return {
        text: getItemName(n.node, n.name),
        kind: ts.getNodeKind(n.node),
        kindModifiers: getModifiers(n.node),
        spans: getSpans(n),
        nameSpan: n.name && getNodeSpan(n.name),
        childItems: ts.map(n.children, convertToTree)
    };
}
/* @internal */
function convertToPrimaryNavBarMenuItem(n: NavigationBarNode): ts.NavigationBarItem {
    return {
        text: getItemName(n.node, n.name),
        kind: ts.getNodeKind(n.node),
        kindModifiers: getModifiers(n.node),
        spans: getSpans(n),
        childItems: ts.map(n.children, convertToSecondaryNavBarMenuItem) || emptyChildItemArray,
        indent: n.indent,
        bolded: false,
        grayed: false
    };
    function convertToSecondaryNavBarMenuItem(n: NavigationBarNode): ts.NavigationBarItem {
        return {
            text: getItemName(n.node, n.name),
            kind: ts.getNodeKind(n.node),
            kindModifiers: ts.getNodeModifiers(n.node),
            spans: getSpans(n),
            childItems: emptyChildItemArray,
            indent: 0,
            bolded: false,
            grayed: false
        };
    }
}
/* @internal */
function getSpans(n: NavigationBarNode): ts.TextSpan[] {
    const spans = [getNodeSpan(n.node)];
    if (n.additionalNodes) {
        for (const node of n.additionalNodes) {
            spans.push(getNodeSpan(node));
        }
    }
    return spans;
}
/* @internal */
function getModuleName(moduleDeclaration: ts.ModuleDeclaration): string {
    // We want to maintain quotation marks.
    if (ts.isAmbientModule(moduleDeclaration)) {
        return ts.getTextOfNode(moduleDeclaration.name);
    }
    // Otherwise, we need to aggregate each identifier to build up the qualified name.
    const result: string[] = [];
    result.push(ts.getTextOfIdentifierOrLiteral(moduleDeclaration.name));
    while (moduleDeclaration.body && moduleDeclaration.body.kind === ts.SyntaxKind.ModuleDeclaration) {
        moduleDeclaration = (<ts.ModuleDeclaration>moduleDeclaration.body);
        result.push(ts.getTextOfIdentifierOrLiteral(moduleDeclaration.name));
    }
    return result.join(".");
}
/**
 * For 'module A.B.C', we want to get the node for 'C'.
 * We store 'A' as associated with a NavNode, and use getModuleName to traverse down again.
 */
/* @internal */
function getInteriorModule(decl: ts.ModuleDeclaration): ts.ModuleDeclaration {
    return decl.body && ts.isModuleDeclaration(decl.body) ? getInteriorModule(decl.body) : decl;
}
/* @internal */
function isComputedProperty(member: ts.EnumMember): boolean {
    return !member.name || member.name.kind === ts.SyntaxKind.ComputedPropertyName;
}
/* @internal */
function getNodeSpan(node: ts.Node): ts.TextSpan {
    return node.kind === ts.SyntaxKind.SourceFile ? ts.createTextSpanFromRange(node) : ts.createTextSpanFromNode(node, curSourceFile);
}
/* @internal */
function getModifiers(node: ts.Node): string {
    if (node.parent && node.parent.kind === ts.SyntaxKind.VariableDeclaration) {
        node = node.parent;
    }
    return ts.getNodeModifiers(node);
}
/* @internal */
function getFunctionOrClassName(node: ts.FunctionExpression | ts.FunctionDeclaration | ts.ArrowFunction | ts.ClassLikeDeclaration): string {
    const { parent } = node;
    if (node.name && ts.getFullWidth(node.name) > 0) {
        return cleanText(ts.declarationNameToString(node.name));
    }
    // See if it is a var initializer. If so, use the var name.
    else if (ts.isVariableDeclaration(parent)) {
        return cleanText(ts.declarationNameToString(parent.name));
    }
    // See if it is of the form "<expr> = function(){...}". If so, use the text from the left-hand side.
    else if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        return nodeText(parent.left).replace(whiteSpaceRegex, "");
    }
    // See if it is a property assignment, and if so use the property name
    else if (ts.isPropertyAssignment(parent)) {
        return nodeText(parent.name);
    }
    // Default exports are named "default"
    else if (ts.getModifierFlags(node) & ts.ModifierFlags.Default) {
        return "default";
    }
    else if (ts.isClassLike(node)) {
        return "<class>";
    }
    else if (ts.isCallExpression(parent)) {
        let name = getCalledExpressionName(parent.expression);
        if (name !== undefined) {
            name = cleanText(name);
            if (name.length > maxLength) {
                return `${name} callback`;
            }
            const args = cleanText(ts.mapDefined(parent.arguments, a => ts.isStringLiteralLike(a) ? a.getText(curSourceFile) : undefined).join(", "));
            return `${name}(${args}) callback`;
        }
    }
    return "<function>";
}
// See also 'tryGetPropertyAccessOrIdentifierToString'
/* @internal */
function getCalledExpressionName(expr: ts.Expression): string | undefined {
    if (ts.isIdentifier(expr)) {
        return expr.text;
    }
    else if (ts.isPropertyAccessExpression(expr)) {
        const left = getCalledExpressionName(expr.expression);
        const right = expr.name.text;
        return left === undefined ? right : `${left}.${right}`;
    }
    else {
        return undefined;
    }
}
/* @internal */
function isFunctionOrClassExpression(node: ts.Node): node is ts.ArrowFunction | ts.FunctionExpression | ts.ClassExpression {
    switch (node.kind) {
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.ClassExpression:
            return true;
        default:
            return false;
    }
}
/* @internal */
function cleanText(text: string): string {
    // Truncate to maximum amount of characters as we don't want to do a big replace operation.
    text = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    // Replaces ECMAScript line terminators and removes the trailing `\` from each line:
    // \n - Line Feed
    // \r - Carriage Return
    // \u2028 - Line separator
    // \u2029 - Paragraph separator
    return text.replace(/\\?(\r?\n|\r|\u2028|\u2029)/g, "");
}

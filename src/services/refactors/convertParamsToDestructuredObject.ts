/* @internal */
namespace ts.refactor.convertParamsToDestructuredObject {
    const refactorName = "Convert parameters to destructured object";
    const minimumParameterLength = 2;
    ts.refactor.registerRefactor(refactorName, { getEditsForAction, getAvailableActions });
    function getAvailableActions(context: ts.RefactorContext): readonly ts.ApplicableRefactorInfo[] {
        const { file, startPosition } = context;
        const isJSFile = ts.isSourceFileJS(file);
        if (isJSFile)
            return ts.emptyArray; // TODO: GH#30113
        const functionDeclaration = getFunctionDeclarationAtPosition(file, startPosition, context.program.getTypeChecker());
        if (!functionDeclaration)
            return ts.emptyArray;
        const description = ts.getLocaleSpecificMessage(ts.Diagnostics.Convert_parameters_to_destructured_object);
        return [{
                name: refactorName,
                description,
                actions: [{
                        name: refactorName,
                        description
                    }]
            }];
    }
    function getEditsForAction(context: ts.RefactorContext, actionName: string): ts.RefactorEditInfo | undefined {
        ts.Debug.assert(actionName === refactorName, "Unexpected action name");
        const { file, startPosition, program, cancellationToken, host } = context;
        const functionDeclaration = getFunctionDeclarationAtPosition(file, startPosition, program.getTypeChecker());
        if (!functionDeclaration || !cancellationToken)
            return undefined;
        const groupedReferences = getGroupedReferences(functionDeclaration, program, cancellationToken);
        if (groupedReferences.valid) {
            const edits = ts.textChanges.ChangeTracker.with(context, t => doChange(file, program, host, t, functionDeclaration, groupedReferences));
            return { renameFilename: undefined, renameLocation: undefined, edits };
        }
        return { edits: [] }; // TODO: GH#30113
    }
    function doChange(sourceFile: ts.SourceFile, program: ts.Program, host: ts.LanguageServiceHost, changes: ts.textChanges.ChangeTracker, functionDeclaration: ValidFunctionDeclaration, groupedReferences: GroupedReferences): void {
        const newParamDeclaration = ts.map(createNewParameters(functionDeclaration, program, host), param => ts.getSynthesizedDeepClone(param));
        changes.replaceNodeRangeWithNodes(sourceFile, ts.first(functionDeclaration.parameters), ts.last(functionDeclaration.parameters), newParamDeclaration, { joiner: ", ",
            // indentation is set to 0 because otherwise the object parameter will be indented if there is a `this` parameter
            indentation: 0,
            leadingTriviaOption: ts.textChanges.LeadingTriviaOption.IncludeAll,
            trailingTriviaOption: ts.textChanges.TrailingTriviaOption.Include
        });
        const functionCalls = ts.sortAndDeduplicate(groupedReferences.functionCalls, /*comparer*/ (a, b) => ts.compareValues(a.pos, b.pos));
        for (const call of functionCalls) {
            if (call.arguments && call.arguments.length) {
                const newArgument = ts.getSynthesizedDeepClone(createNewArgument(functionDeclaration, call.arguments), /*includeTrivia*/ true);
                changes.replaceNodeRange(ts.getSourceFileOfNode(call), ts.first(call.arguments), ts.last(call.arguments), newArgument, { leadingTriviaOption: ts.textChanges.LeadingTriviaOption.IncludeAll, trailingTriviaOption: ts.textChanges.TrailingTriviaOption.Include });
            }
        }
    }
    function getGroupedReferences(functionDeclaration: ValidFunctionDeclaration, program: ts.Program, cancellationToken: ts.CancellationToken): GroupedReferences {
        const functionNames = getFunctionNames(functionDeclaration);
        const classNames = ts.isConstructorDeclaration(functionDeclaration) ? getClassNames(functionDeclaration) : [];
        const names = ts.deduplicate([...functionNames, ...classNames], ts.equateValues);
        const checker = program.getTypeChecker();
        const references = ts.flatMap(names, /*mapfn*/ /*mapfn*/ name => ts.FindAllReferences.getReferenceEntriesForNode(-1, name, program, program.getSourceFiles(), cancellationToken));
        const groupedReferences = groupReferences(references);
        if (!ts.every(groupedReferences.declarations, /*callback*/ /*callback*/ decl => ts.contains(names, decl))) {
            groupedReferences.valid = false;
        }
        return groupedReferences;
        function groupReferences(referenceEntries: readonly ts.FindAllReferences.Entry[]): GroupedReferences {
            const classReferences: ClassReferences = { accessExpressions: [], typeUsages: [] };
            const groupedReferences: GroupedReferences = { functionCalls: [], declarations: [], classReferences, valid: true };
            const functionSymbols = ts.map(functionNames, getSymbolTargetAtLocation);
            const classSymbols = ts.map(classNames, getSymbolTargetAtLocation);
            const isConstructor = ts.isConstructorDeclaration(functionDeclaration);
            for (const entry of referenceEntries) {
                if (entry.kind !== ts.FindAllReferences.EntryKind.Node) {
                    groupedReferences.valid = false;
                    continue;
                }
                /* We compare symbols because in some cases find all references wil return a reference that may or may not be to the refactored function.
                Example from the refactorConvertParamsToDestructuredObject_methodCallUnion.ts test:
                    class A { foo(a: number, b: number) { return a + b; } }
                    class B { foo(c: number, d: number) { return c + d; } }
                    declare const ab: A | B;
                    ab.foo(1, 2);
                Find all references will return `ab.foo(1, 2)` as a reference to A's `foo` but we could be calling B's `foo`.
                When looking for constructor calls, however, the symbol on the constructor call reference is going to be the corresponding class symbol.
                So we need to add a special case for this because when calling a constructor of a class through one of its subclasses,
                the symbols are going to be different.
                */
                if (ts.contains(functionSymbols, getSymbolTargetAtLocation(entry.node)) || ts.isNewExpressionTarget(entry.node)) {
                    const importOrExportReference = entryToImportOrExport(entry);
                    if (importOrExportReference) {
                        continue;
                    }
                    const decl = entryToDeclaration(entry);
                    if (decl) {
                        groupedReferences.declarations.push(decl);
                        continue;
                    }
                    const call = entryToFunctionCall(entry);
                    if (call) {
                        groupedReferences.functionCalls.push(call);
                        continue;
                    }
                }
                // if the refactored function is a constructor, we must also check if the references to its class are valid
                if (isConstructor && ts.contains(classSymbols, getSymbolTargetAtLocation(entry.node))) {
                    const importOrExportReference = entryToImportOrExport(entry);
                    if (importOrExportReference) {
                        continue;
                    }
                    const decl = entryToDeclaration(entry);
                    if (decl) {
                        groupedReferences.declarations.push(decl);
                        continue;
                    }
                    const accessExpression = entryToAccessExpression(entry);
                    if (accessExpression) {
                        classReferences.accessExpressions.push(accessExpression);
                        continue;
                    }
                    // Only class declarations are allowed to be used as a type (in a heritage clause),
                    // otherwise `findAllReferences` might not be able to track constructor calls.
                    if (ts.isClassDeclaration(functionDeclaration.parent)) {
                        const type = entryToType(entry);
                        if (type) {
                            classReferences.typeUsages.push(type);
                            continue;
                        }
                    }
                }
                groupedReferences.valid = false;
            }
            return groupedReferences;
        }
        function getSymbolTargetAtLocation(node: ts.Node) {
            const symbol = checker.getSymbolAtLocation(node);
            return symbol && ts.getSymbolTarget(symbol, checker);
        }
    }
    function entryToImportOrExport(entry: ts.FindAllReferences.NodeEntry): ts.Node | undefined {
        const node = entry.node;
        if (ts.isImportSpecifier(node.parent)
            || ts.isImportClause(node.parent)
            || ts.isImportEqualsDeclaration(node.parent)
            || ts.isNamespaceImport(node.parent)) {
            return node;
        }
        if (ts.isExportSpecifier(node.parent) || ts.isExportAssignment(node.parent)) {
            return node;
        }
        return undefined;
    }
    function entryToDeclaration(entry: ts.FindAllReferences.NodeEntry): ts.Node | undefined {
        if (ts.isDeclaration(entry.node.parent)) {
            return entry.node;
        }
        return undefined;
    }
    function entryToFunctionCall(entry: ts.FindAllReferences.NodeEntry): ts.CallExpression | ts.NewExpression | undefined {
        if (entry.node.parent) {
            const functionReference = entry.node;
            const parent = functionReference.parent;
            switch (parent.kind) {
                // foo(...) or super(...) or new Foo(...)
                case ts.SyntaxKind.CallExpression:
                case ts.SyntaxKind.NewExpression:
                    const callOrNewExpression = ts.tryCast(parent, ts.isCallOrNewExpression);
                    if (callOrNewExpression && callOrNewExpression.expression === functionReference) {
                        return callOrNewExpression;
                    }
                    break;
                // x.foo(...)
                case ts.SyntaxKind.PropertyAccessExpression:
                    const propertyAccessExpression = ts.tryCast(parent, ts.isPropertyAccessExpression);
                    if (propertyAccessExpression && propertyAccessExpression.parent && propertyAccessExpression.name === functionReference) {
                        const callOrNewExpression = ts.tryCast(propertyAccessExpression.parent, ts.isCallOrNewExpression);
                        if (callOrNewExpression && callOrNewExpression.expression === propertyAccessExpression) {
                            return callOrNewExpression;
                        }
                    }
                    break;
                // x["foo"](...)
                case ts.SyntaxKind.ElementAccessExpression:
                    const elementAccessExpression = ts.tryCast(parent, ts.isElementAccessExpression);
                    if (elementAccessExpression && elementAccessExpression.parent && elementAccessExpression.argumentExpression === functionReference) {
                        const callOrNewExpression = ts.tryCast(elementAccessExpression.parent, ts.isCallOrNewExpression);
                        if (callOrNewExpression && callOrNewExpression.expression === elementAccessExpression) {
                            return callOrNewExpression;
                        }
                    }
                    break;
            }
        }
        return undefined;
    }
    function entryToAccessExpression(entry: ts.FindAllReferences.NodeEntry): ts.ElementAccessExpression | ts.PropertyAccessExpression | undefined {
        if (entry.node.parent) {
            const reference = entry.node;
            const parent = reference.parent;
            switch (parent.kind) {
                // `C.foo`
                case ts.SyntaxKind.PropertyAccessExpression:
                    const propertyAccessExpression = ts.tryCast(parent, ts.isPropertyAccessExpression);
                    if (propertyAccessExpression && propertyAccessExpression.expression === reference) {
                        return propertyAccessExpression;
                    }
                    break;
                // `C["foo"]`
                case ts.SyntaxKind.ElementAccessExpression:
                    const elementAccessExpression = ts.tryCast(parent, ts.isElementAccessExpression);
                    if (elementAccessExpression && elementAccessExpression.expression === reference) {
                        return elementAccessExpression;
                    }
                    break;
            }
        }
        return undefined;
    }
    function entryToType(entry: ts.FindAllReferences.NodeEntry): ts.Node | undefined {
        const reference = entry.node;
        if (ts.getMeaningFromLocation(reference) === ts.SemanticMeaning.Type || ts.isExpressionWithTypeArgumentsInClassExtendsClause(reference.parent)) {
            return reference;
        }
        return undefined;
    }
    function getFunctionDeclarationAtPosition(file: ts.SourceFile, startPosition: number, checker: ts.TypeChecker): ValidFunctionDeclaration | undefined {
        const node = ts.getTouchingToken(file, startPosition);
        const functionDeclaration = ts.getContainingFunctionDeclaration(node);
        // don't offer refactor on top-level JSDoc
        if (isTopLevelJSDoc(node))
            return undefined;
        if (functionDeclaration
            && isValidFunctionDeclaration(functionDeclaration, checker)
            && ts.rangeContainsRange(functionDeclaration, node)
            && !(functionDeclaration.body && ts.rangeContainsRange(functionDeclaration.body, node)))
            return functionDeclaration;
        return undefined;
    }
    function isTopLevelJSDoc(node: ts.Node): boolean {
        const containingJSDoc = ts.findAncestor(node, ts.isJSDocNode);
        if (containingJSDoc) {
            const containingNonJSDoc = ts.findAncestor(containingJSDoc, n => !ts.isJSDocNode(n));
            return !!containingNonJSDoc && ts.isFunctionLikeDeclaration(containingNonJSDoc);
        }
        return false;
    }
    function isValidFunctionDeclaration(functionDeclaration: ts.FunctionLikeDeclaration, checker: ts.TypeChecker): functionDeclaration is ValidFunctionDeclaration {
        if (!isValidParameterNodeArray(functionDeclaration.parameters, checker))
            return false;
        switch (functionDeclaration.kind) {
            case ts.SyntaxKind.FunctionDeclaration:
                return hasNameOrDefault(functionDeclaration) && isSingleImplementation(functionDeclaration, checker);
            case ts.SyntaxKind.MethodDeclaration:
                return isSingleImplementation(functionDeclaration, checker);
            case ts.SyntaxKind.Constructor:
                if (ts.isClassDeclaration(functionDeclaration.parent)) {
                    return hasNameOrDefault(functionDeclaration.parent) && isSingleImplementation(functionDeclaration, checker);
                }
                else {
                    return isValidVariableDeclaration(functionDeclaration.parent.parent)
                        && isSingleImplementation(functionDeclaration, checker);
                }
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return isValidVariableDeclaration(functionDeclaration.parent);
        }
        return false;
    }
    function isSingleImplementation(functionDeclaration: ts.FunctionLikeDeclaration, checker: ts.TypeChecker): boolean {
        return !!functionDeclaration.body && !checker.isImplementationOfOverload(functionDeclaration);
    }
    function hasNameOrDefault(functionOrClassDeclaration: ts.FunctionDeclaration | ts.ClassDeclaration): boolean {
        if (!functionOrClassDeclaration.name) {
            const defaultKeyword = ts.findModifier(functionOrClassDeclaration, ts.SyntaxKind.DefaultKeyword);
            return !!defaultKeyword;
        }
        return true;
    }
    function isValidParameterNodeArray(parameters: ts.NodeArray<ts.ParameterDeclaration>, checker: ts.TypeChecker): parameters is ValidParameterNodeArray {
        return getRefactorableParametersLength(parameters) >= minimumParameterLength
            && ts.every(parameters, /*callback*/ /*callback*/ paramDecl => isValidParameterDeclaration(paramDecl, checker));
    }
    function isValidParameterDeclaration(parameterDeclaration: ts.ParameterDeclaration, checker: ts.TypeChecker): parameterDeclaration is ValidParameterDeclaration {
        if (ts.isRestParameter(parameterDeclaration)) {
            const type = checker.getTypeAtLocation(parameterDeclaration);
            if (!checker.isArrayType(type) && !checker.isTupleType(type))
                return false;
        }
        return !parameterDeclaration.modifiers && !parameterDeclaration.decorators && ts.isIdentifier(parameterDeclaration.name);
    }
    function isValidVariableDeclaration(node: ts.Node): node is ValidVariableDeclaration {
        return ts.isVariableDeclaration(node) && ts.isVarConst(node) && ts.isIdentifier(node.name) && !node.type; // TODO: GH#30113
    }
    function hasThisParameter(parameters: ts.NodeArray<ts.ParameterDeclaration>): boolean {
        return parameters.length > 0 && ts.isThis(parameters[0].name);
    }
    function getRefactorableParametersLength(parameters: ts.NodeArray<ts.ParameterDeclaration>): number {
        if (hasThisParameter(parameters)) {
            return parameters.length - 1;
        }
        return parameters.length;
    }
    function getRefactorableParameters(parameters: ts.NodeArray<ValidParameterDeclaration>): ts.NodeArray<ValidParameterDeclaration> {
        if (hasThisParameter(parameters)) {
            parameters = ts.createNodeArray(parameters.slice(1), parameters.hasTrailingComma);
        }
        return parameters;
    }
    function createPropertyOrShorthandAssignment(name: string, initializer: ts.Expression): ts.PropertyAssignment | ts.ShorthandPropertyAssignment {
        if (ts.isIdentifier(initializer) && ts.getTextOfIdentifierOrLiteral(initializer) === name) {
            return ts.createShorthandPropertyAssignment(name);
        }
        return ts.createPropertyAssignment(name, initializer);
    }
    function createNewArgument(functionDeclaration: ValidFunctionDeclaration, functionArguments: ts.NodeArray<ts.Expression>): ts.ObjectLiteralExpression {
        const parameters = getRefactorableParameters(functionDeclaration.parameters);
        const hasRestParameter = ts.isRestParameter(ts.last(parameters));
        const nonRestArguments = hasRestParameter ? functionArguments.slice(0, parameters.length - 1) : functionArguments;
        const properties = ts.map(nonRestArguments, (arg, i) => {
            const parameterName = getParameterName(parameters[i]);
            const property = createPropertyOrShorthandAssignment(parameterName, arg);
            ts.suppressLeadingAndTrailingTrivia(property.name);
            if (ts.isPropertyAssignment(property))
                ts.suppressLeadingAndTrailingTrivia(property.initializer);
            copyComments(arg, property);
            return property;
        });
        if (hasRestParameter && functionArguments.length >= parameters.length) {
            const restArguments = functionArguments.slice(parameters.length - 1);
            const restProperty = ts.createPropertyAssignment(getParameterName(ts.last(parameters)), ts.createArrayLiteral(restArguments));
            properties.push(restProperty);
        }
        const objectLiteral = ts.createObjectLiteral(properties, /*multiLine*/ false);
        return objectLiteral;
    }
    function createNewParameters(functionDeclaration: ValidFunctionDeclaration, program: ts.Program, host: ts.LanguageServiceHost): ts.NodeArray<ts.ParameterDeclaration> {
        const checker = program.getTypeChecker();
        const refactorableParameters = getRefactorableParameters(functionDeclaration.parameters);
        const bindingElements = ts.map(refactorableParameters, createBindingElementFromParameterDeclaration);
        const objectParameterName = ts.createObjectBindingPattern(bindingElements);
        const objectParameterType = createParameterTypeNode(refactorableParameters);
        let objectInitializer: ts.Expression | undefined;
        // If every parameter in the original function was optional, add an empty object initializer to the new object parameter
        if (ts.every(refactorableParameters, isOptionalParameter)) {
            objectInitializer = ts.createObjectLiteral();
        }
        const objectParameter = ts.createParameter(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, 
        /*dotDotDotToken*/ undefined, objectParameterName, 
        /*questionToken*/ undefined, objectParameterType, objectInitializer);
        if (hasThisParameter(functionDeclaration.parameters)) {
            const thisParameter = functionDeclaration.parameters[0];
            const newThisParameter = ts.createParameter(
            /*decorators*/ undefined, 
            /*modifiers*/ undefined, 
            /*dotDotDotToken*/ undefined, thisParameter.name, 
            /*questionToken*/ undefined, thisParameter.type);
            ts.suppressLeadingAndTrailingTrivia(newThisParameter.name);
            copyComments(thisParameter.name, newThisParameter.name);
            if (thisParameter.type) {
                ts.suppressLeadingAndTrailingTrivia((newThisParameter.type!));
                copyComments(thisParameter.type, newThisParameter.type!);
            }
            return ts.createNodeArray([newThisParameter, objectParameter]);
        }
        return ts.createNodeArray([objectParameter]);
        function createBindingElementFromParameterDeclaration(parameterDeclaration: ValidParameterDeclaration): ts.BindingElement {
            const element = ts.createBindingElement(
            /*dotDotDotToken*/ undefined, 
            /*propertyName*/ undefined, getParameterName(parameterDeclaration), ts.isRestParameter(parameterDeclaration) && isOptionalParameter(parameterDeclaration) ? ts.createArrayLiteral() : parameterDeclaration.initializer);
            ts.suppressLeadingAndTrailingTrivia(element);
            if (parameterDeclaration.initializer && element.initializer) {
                copyComments(parameterDeclaration.initializer, element.initializer);
            }
            return element;
        }
        function createParameterTypeNode(parameters: ts.NodeArray<ValidParameterDeclaration>): ts.TypeLiteralNode {
            const members = ts.map(parameters, createPropertySignatureFromParameterDeclaration);
            const typeNode = ts.addEmitFlags(ts.createTypeLiteralNode(members), ts.EmitFlags.SingleLine);
            return typeNode;
        }
        function createPropertySignatureFromParameterDeclaration(parameterDeclaration: ValidParameterDeclaration): ts.PropertySignature {
            let parameterType = parameterDeclaration.type;
            if (!parameterType && (parameterDeclaration.initializer || ts.isRestParameter(parameterDeclaration))) {
                parameterType = getTypeNode(parameterDeclaration);
            }
            const propertySignature = ts.createPropertySignature(
            /*modifiers*/ undefined, getParameterName(parameterDeclaration), isOptionalParameter(parameterDeclaration) ? ts.createToken(ts.SyntaxKind.QuestionToken) : parameterDeclaration.questionToken, parameterType, 
            /*initializer*/ undefined);
            ts.suppressLeadingAndTrailingTrivia(propertySignature);
            copyComments(parameterDeclaration.name, propertySignature.name);
            if (parameterDeclaration.type && propertySignature.type) {
                copyComments(parameterDeclaration.type, propertySignature.type);
            }
            return propertySignature;
        }
        function getTypeNode(node: ts.Node): ts.TypeNode | undefined {
            const type = checker.getTypeAtLocation(node);
            return ts.getTypeNodeIfAccessible(type, node, program, host);
        }
        function isOptionalParameter(parameterDeclaration: ValidParameterDeclaration): boolean {
            if (ts.isRestParameter(parameterDeclaration)) {
                const type = checker.getTypeAtLocation(parameterDeclaration);
                return !checker.isTupleType(type);
            }
            return checker.isOptionalParameter(parameterDeclaration);
        }
    }
    function copyComments(sourceNode: ts.Node, targetNode: ts.Node) {
        const sourceFile = sourceNode.getSourceFile();
        const text = sourceFile.text;
        if (hasLeadingLineBreak(sourceNode, text)) {
            ts.copyLeadingComments(sourceNode, targetNode, sourceFile);
        }
        else {
            ts.copyTrailingAsLeadingComments(sourceNode, targetNode, sourceFile);
        }
        ts.copyTrailingComments(sourceNode, targetNode, sourceFile);
    }
    function hasLeadingLineBreak(node: ts.Node, text: string) {
        const start = node.getFullStart();
        const end = node.getStart();
        for (let i = start; i < end; i++) {
            if (text.charCodeAt(i) === ts.CharacterCodes.lineFeed)
                return true;
        }
        return false;
    }
    function getParameterName(paramDeclaration: ValidParameterDeclaration) {
        return ts.getTextOfIdentifierOrLiteral(paramDeclaration.name);
    }
    function getClassNames(constructorDeclaration: ValidConstructor): (ts.Identifier | ts.Modifier)[] {
        switch (constructorDeclaration.parent.kind) {
            case ts.SyntaxKind.ClassDeclaration:
                const classDeclaration = constructorDeclaration.parent;
                if (classDeclaration.name)
                    return [classDeclaration.name];
                // If the class declaration doesn't have a name, it should have a default modifier.
                // We validated this in `isValidFunctionDeclaration` through `hasNameOrDefault`
                const defaultModifier = ts.Debug.assertDefined(ts.findModifier(classDeclaration, ts.SyntaxKind.DefaultKeyword), "Nameless class declaration should be a default export");
                return [defaultModifier];
            case ts.SyntaxKind.ClassExpression:
                const classExpression = constructorDeclaration.parent;
                const variableDeclaration = constructorDeclaration.parent.parent;
                const className = classExpression.name;
                if (className)
                    return [className, variableDeclaration.name];
                return [variableDeclaration.name];
        }
    }
    function getFunctionNames(functionDeclaration: ValidFunctionDeclaration): ts.Node[] {
        switch (functionDeclaration.kind) {
            case ts.SyntaxKind.FunctionDeclaration:
                if (functionDeclaration.name)
                    return [functionDeclaration.name];
                // If the function declaration doesn't have a name, it should have a default modifier.
                // We validated this in `isValidFunctionDeclaration` through `hasNameOrDefault`
                const defaultModifier = ts.Debug.assertDefined(ts.findModifier(functionDeclaration, ts.SyntaxKind.DefaultKeyword), "Nameless function declaration should be a default export");
                return [defaultModifier];
            case ts.SyntaxKind.MethodDeclaration:
                return [functionDeclaration.name];
            case ts.SyntaxKind.Constructor:
                const ctrKeyword = ts.Debug.assertDefined(ts.findChildOfKind(functionDeclaration, ts.SyntaxKind.ConstructorKeyword, functionDeclaration.getSourceFile()), "Constructor declaration should have constructor keyword");
                if (functionDeclaration.parent.kind === ts.SyntaxKind.ClassExpression) {
                    const variableDeclaration = functionDeclaration.parent.parent;
                    return [variableDeclaration.name, ctrKeyword];
                }
                return [ctrKeyword];
            case ts.SyntaxKind.ArrowFunction:
                return [functionDeclaration.parent.name];
            case ts.SyntaxKind.FunctionExpression:
                if (functionDeclaration.name)
                    return [functionDeclaration.name, functionDeclaration.parent.name];
                return [functionDeclaration.parent.name];
            default:
                return ts.Debug.assertNever(functionDeclaration, `Unexpected function declaration kind ${(functionDeclaration as ValidFunctionDeclaration).kind}`);
        }
    }
    type ValidParameterNodeArray = ts.NodeArray<ValidParameterDeclaration>;
    interface ValidVariableDeclaration extends ts.VariableDeclaration {
        name: ts.Identifier;
        type: undefined;
    }
    interface ValidConstructor extends ts.ConstructorDeclaration {
        parent: ts.ClassDeclaration | (ts.ClassExpression & {
            parent: ValidVariableDeclaration;
        });
        parameters: ts.NodeArray<ValidParameterDeclaration>;
        body: ts.FunctionBody;
    }
    interface ValidFunction extends ts.FunctionDeclaration {
        parameters: ts.NodeArray<ValidParameterDeclaration>;
        body: ts.FunctionBody;
    }
    interface ValidMethod extends ts.MethodDeclaration {
        parameters: ts.NodeArray<ValidParameterDeclaration>;
        body: ts.FunctionBody;
    }
    interface ValidFunctionExpression extends ts.FunctionExpression {
        parent: ValidVariableDeclaration;
        parameters: ts.NodeArray<ValidParameterDeclaration>;
    }
    interface ValidArrowFunction extends ts.ArrowFunction {
        parent: ValidVariableDeclaration;
        parameters: ts.NodeArray<ValidParameterDeclaration>;
    }
    type ValidFunctionDeclaration = ValidConstructor | ValidFunction | ValidMethod | ValidArrowFunction | ValidFunctionExpression;
    interface ValidParameterDeclaration extends ts.ParameterDeclaration {
        name: ts.Identifier;
        modifiers: undefined;
        decorators: undefined;
    }
    interface GroupedReferences {
        functionCalls: (ts.CallExpression | ts.NewExpression)[];
        declarations: ts.Node[];
        classReferences?: ClassReferences;
        valid: boolean;
    }
    interface ClassReferences {
        accessExpressions: ts.Node[];
        typeUsages: ts.Node[];
    }
}

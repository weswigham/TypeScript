namespace ts {
    function createSynthesizedNode(kind: ts.SyntaxKind): ts.Node {
        const node = ts.createNode(kind, -1, -1);
        node.flags |= ts.NodeFlags.Synthesized;
        return node;
    }
    /* @internal */
    export function updateNode<T extends ts.Node>(updated: T, original: T): T {
        if (updated !== original) {
            setOriginalNode(updated, original);
            setTextRange(updated, original);
            ts.aggregateTransformFlags(updated);
        }
        return updated;
    }
    /* @internal */ export function createNodeArray<T extends ts.Node>(elements?: T[], hasTrailingComma?: boolean): ts.MutableNodeArray<T>;
    export function createNodeArray<T extends ts.Node>(elements?: readonly T[], hasTrailingComma?: boolean): ts.NodeArray<T>;
    /**
     * Make `elements` into a `NodeArray<T>`. If `elements` is `undefined`, returns an empty `NodeArray<T>`.
     */
    export function createNodeArray<T extends ts.Node>(elements?: readonly T[], hasTrailingComma?: boolean): ts.NodeArray<T> {
        if (!elements || elements === ts.emptyArray) {
            elements = [];
        }
        else if (ts.isNodeArray(elements)) {
            return elements;
        }
        const array = (<ts.NodeArray<T>>elements);
        array.pos = -1;
        array.end = -1;
        array.hasTrailingComma = hasTrailingComma;
        return array;
    }
    /**
     * Creates a shallow, memberwise clone of a node with no source map location.
     */
    /* @internal */
    export function getSynthesizedClone<T extends ts.Node>(node: T): T {
        // We don't use "clone" from core.ts here, as we need to preserve the prototype chain of
        // the original node. We also need to exclude specific properties and only include own-
        // properties (to skip members already defined on the shared prototype).
        if (node === undefined) {
            return node;
        }
        const clone = <T>createSynthesizedNode(node.kind);
        clone.flags |= node.flags;
        setOriginalNode(clone, node);
        for (const key in node) {
            if (clone.hasOwnProperty(key) || !node.hasOwnProperty(key)) {
                continue;
            }
            (<any>clone)[key] = (<any>node)[key];
        }
        return clone;
    }
    // Literals
    /* @internal */ export function createLiteral(value: string | ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | ts.NumericLiteral | ts.Identifier, isSingleQuote: boolean): ts.StringLiteral; // eslint-disable-line @typescript-eslint/unified-signatures
    /* @internal */ export function createLiteral(value: string | number, isSingleQuote: boolean): ts.StringLiteral | ts.NumericLiteral;
    /** If a node is passed, creates a string literal whose source text is read from a source node during emit. */
    export function createLiteral(value: string | ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | ts.NumericLiteral | ts.Identifier): ts.StringLiteral;
    export function createLiteral(value: number | ts.PseudoBigInt): ts.NumericLiteral;
    export function createLiteral(value: boolean): ts.BooleanLiteral;
    export function createLiteral(value: string | number | ts.PseudoBigInt | boolean): ts.PrimaryExpression;
    export function createLiteral(value: string | number | ts.PseudoBigInt | boolean | ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | ts.NumericLiteral | ts.Identifier, isSingleQuote?: boolean): ts.PrimaryExpression {
        if (typeof value === "number") {
            return createNumericLiteral(value + "");
        }
        // eslint-disable-next-line no-in-operator
        if (typeof value === "object" && "base10Value" in value) { // PseudoBigInt
            return createBigIntLiteral(ts.pseudoBigIntToString(value) + "n");
        }
        if (typeof value === "boolean") {
            return value ? createTrue() : createFalse();
        }
        if (ts.isString(value)) {
            const res = createStringLiteral(value);
            if (isSingleQuote)
                res.singleQuote = true;
            return res;
        }
        return createLiteralFromNode(value);
    }
    export function createNumericLiteral(value: string, numericLiteralFlags: ts.TokenFlags = ts.TokenFlags.None): ts.NumericLiteral {
        const node = (<ts.NumericLiteral>createSynthesizedNode(ts.SyntaxKind.NumericLiteral));
        node.text = value;
        node.numericLiteralFlags = numericLiteralFlags;
        return node;
    }
    export function createBigIntLiteral(value: string): ts.BigIntLiteral {
        const node = (<ts.BigIntLiteral>createSynthesizedNode(ts.SyntaxKind.BigIntLiteral));
        node.text = value;
        return node;
    }
    export function createStringLiteral(text: string): ts.StringLiteral {
        const node = (<ts.StringLiteral>createSynthesizedNode(ts.SyntaxKind.StringLiteral));
        node.text = text;
        return node;
    }
    export function createRegularExpressionLiteral(text: string): ts.RegularExpressionLiteral {
        const node = (<ts.RegularExpressionLiteral>createSynthesizedNode(ts.SyntaxKind.RegularExpressionLiteral));
        node.text = text;
        return node;
    }
    function createLiteralFromNode(sourceNode: ts.PropertyNameLiteral): ts.StringLiteral {
        const node = createStringLiteral(ts.getTextOfIdentifierOrLiteral(sourceNode));
        node.textSourceNode = sourceNode;
        return node;
    }
    // Identifiers
    export function createIdentifier(text: string): ts.Identifier;
    /* @internal */
    export function createIdentifier(text: string, typeArguments: readonly (ts.TypeNode | ts.TypeParameterDeclaration)[] | undefined): ts.Identifier; // eslint-disable-line @typescript-eslint/unified-signatures
    export function createIdentifier(text: string, typeArguments?: readonly (ts.TypeNode | ts.TypeParameterDeclaration)[]): ts.Identifier {
        const node = (<ts.Identifier>createSynthesizedNode(ts.SyntaxKind.Identifier));
        node.escapedText = ts.escapeLeadingUnderscores(text);
        node.originalKeywordKind = text ? ts.stringToToken(text) : ts.SyntaxKind.Unknown;
        node.autoGenerateFlags = ts.GeneratedIdentifierFlags.None;
        node.autoGenerateId = 0;
        if (typeArguments) {
            node.typeArguments = createNodeArray((typeArguments as readonly ts.TypeNode[]));
        }
        return node;
    }
    export function updateIdentifier(node: ts.Identifier): ts.Identifier;
    /* @internal */
    export function updateIdentifier(node: ts.Identifier, typeArguments: ts.NodeArray<ts.TypeNode | ts.TypeParameterDeclaration> | undefined): ts.Identifier; // eslint-disable-line @typescript-eslint/unified-signatures
    export function updateIdentifier(node: ts.Identifier, typeArguments?: ts.NodeArray<ts.TypeNode | ts.TypeParameterDeclaration> | undefined): ts.Identifier {
        return node.typeArguments !== typeArguments
            ? updateNode(createIdentifier(ts.idText(node), typeArguments), node)
            : node;
    }
    let nextAutoGenerateId = 0;
    /** Create a unique temporary variable. */
    export function createTempVariable(recordTempVariable: ((node: ts.Identifier) => void) | undefined): ts.Identifier;
    /* @internal */ export function createTempVariable(recordTempVariable: ((node: ts.Identifier) => void) | undefined, reservedInNestedScopes: boolean): ts.GeneratedIdentifier;
    export function createTempVariable(recordTempVariable: ((node: ts.Identifier) => void) | undefined, reservedInNestedScopes?: boolean): ts.GeneratedIdentifier {
        const name = (createIdentifier("") as ts.GeneratedIdentifier);
        name.autoGenerateFlags = ts.GeneratedIdentifierFlags.Auto;
        name.autoGenerateId = nextAutoGenerateId;
        nextAutoGenerateId++;
        if (recordTempVariable) {
            recordTempVariable(name);
        }
        if (reservedInNestedScopes) {
            name.autoGenerateFlags |= ts.GeneratedIdentifierFlags.ReservedInNestedScopes;
        }
        return name;
    }
    /** Create a unique temporary variable for use in a loop. */
    export function createLoopVariable(): ts.Identifier {
        const name = createIdentifier("");
        name.autoGenerateFlags = ts.GeneratedIdentifierFlags.Loop;
        name.autoGenerateId = nextAutoGenerateId;
        nextAutoGenerateId++;
        return name;
    }
    /** Create a unique name based on the supplied text. */
    export function createUniqueName(text: string): ts.Identifier {
        const name = createIdentifier(text);
        name.autoGenerateFlags = ts.GeneratedIdentifierFlags.Unique;
        name.autoGenerateId = nextAutoGenerateId;
        nextAutoGenerateId++;
        return name;
    }
    /* @internal */ export function createOptimisticUniqueName(text: string): ts.GeneratedIdentifier;
    /** Create a unique name based on the supplied text. */
    export function createOptimisticUniqueName(text: string): ts.Identifier;
    export function createOptimisticUniqueName(text: string): ts.GeneratedIdentifier {
        const name = (createIdentifier(text) as ts.GeneratedIdentifier);
        name.autoGenerateFlags = ts.GeneratedIdentifierFlags.Unique | ts.GeneratedIdentifierFlags.Optimistic;
        name.autoGenerateId = nextAutoGenerateId;
        nextAutoGenerateId++;
        return name;
    }
    /** Create a unique name based on the supplied text. This does not consider names injected by the transformer. */
    export function createFileLevelUniqueName(text: string): ts.Identifier {
        const name = createOptimisticUniqueName(text);
        name.autoGenerateFlags |= ts.GeneratedIdentifierFlags.FileLevel;
        return name;
    }
    /** Create a unique name generated for a node. */
    export function getGeneratedNameForNode(node: ts.Node | undefined): ts.Identifier;
    /* @internal */ export function getGeneratedNameForNode(node: ts.Node | undefined, flags: ts.GeneratedIdentifierFlags): ts.Identifier; // eslint-disable-line @typescript-eslint/unified-signatures
    export function getGeneratedNameForNode(node: ts.Node | undefined, flags?: ts.GeneratedIdentifierFlags): ts.Identifier {
        const name = createIdentifier(node && ts.isIdentifier(node) ? ts.idText(node) : "");
        name.autoGenerateFlags = ts.GeneratedIdentifierFlags.Node | (flags!);
        name.autoGenerateId = nextAutoGenerateId;
        name.original = node;
        nextAutoGenerateId++;
        return name;
    }
    // Punctuation
    export function createToken<TKind extends ts.SyntaxKind>(token: TKind) {
        return <ts.Token<TKind>>createSynthesizedNode(token);
    }
    // Reserved words
    export function createSuper() {
        return <ts.SuperExpression>createSynthesizedNode(ts.SyntaxKind.SuperKeyword);
    }
    export function createThis() {
        return <ts.ThisExpression & ts.Token<ts.SyntaxKind.ThisKeyword>>createSynthesizedNode(ts.SyntaxKind.ThisKeyword);
    }
    export function createNull() {
        return <ts.NullLiteral & ts.Token<ts.SyntaxKind.NullKeyword>>createSynthesizedNode(ts.SyntaxKind.NullKeyword);
    }
    export function createTrue() {
        return <ts.BooleanLiteral & ts.Token<ts.SyntaxKind.TrueKeyword>>createSynthesizedNode(ts.SyntaxKind.TrueKeyword);
    }
    export function createFalse() {
        return <ts.BooleanLiteral & ts.Token<ts.SyntaxKind.FalseKeyword>>createSynthesizedNode(ts.SyntaxKind.FalseKeyword);
    }
    // Modifiers
    export function createModifier<T extends ts.Modifier["kind"]>(kind: T): ts.Token<T> {
        return createToken(kind);
    }
    export function createModifiersFromModifierFlags(flags: ts.ModifierFlags) {
        const result: ts.Modifier[] = [];
        if (flags & ts.ModifierFlags.Export) {
            result.push(createModifier(ts.SyntaxKind.ExportKeyword));
        }
        if (flags & ts.ModifierFlags.Ambient) {
            result.push(createModifier(ts.SyntaxKind.DeclareKeyword));
        }
        if (flags & ts.ModifierFlags.Default) {
            result.push(createModifier(ts.SyntaxKind.DefaultKeyword));
        }
        if (flags & ts.ModifierFlags.Const) {
            result.push(createModifier(ts.SyntaxKind.ConstKeyword));
        }
        if (flags & ts.ModifierFlags.Public) {
            result.push(createModifier(ts.SyntaxKind.PublicKeyword));
        }
        if (flags & ts.ModifierFlags.Private) {
            result.push(createModifier(ts.SyntaxKind.PrivateKeyword));
        }
        if (flags & ts.ModifierFlags.Protected) {
            result.push(createModifier(ts.SyntaxKind.ProtectedKeyword));
        }
        if (flags & ts.ModifierFlags.Abstract) {
            result.push(createModifier(ts.SyntaxKind.AbstractKeyword));
        }
        if (flags & ts.ModifierFlags.Static) {
            result.push(createModifier(ts.SyntaxKind.StaticKeyword));
        }
        if (flags & ts.ModifierFlags.Readonly) {
            result.push(createModifier(ts.SyntaxKind.ReadonlyKeyword));
        }
        if (flags & ts.ModifierFlags.Async) {
            result.push(createModifier(ts.SyntaxKind.AsyncKeyword));
        }
        return result;
    }
    // Names
    export function createQualifiedName(left: ts.EntityName, right: string | ts.Identifier) {
        const node = (<ts.QualifiedName>createSynthesizedNode(ts.SyntaxKind.QualifiedName));
        node.left = left;
        node.right = asName(right);
        return node;
    }
    export function updateQualifiedName(node: ts.QualifiedName, left: ts.EntityName, right: ts.Identifier) {
        return node.left !== left
            || node.right !== right
            ? updateNode(createQualifiedName(left, right), node)
            : node;
    }
    function parenthesizeForComputedName(expression: ts.Expression): ts.Expression {
        return ts.isCommaSequence(expression)
            ? createParen(expression)
            : expression;
    }
    export function createComputedPropertyName(expression: ts.Expression) {
        const node = (<ts.ComputedPropertyName>createSynthesizedNode(ts.SyntaxKind.ComputedPropertyName));
        node.expression = parenthesizeForComputedName(expression);
        return node;
    }
    export function updateComputedPropertyName(node: ts.ComputedPropertyName, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createComputedPropertyName(expression), node)
            : node;
    }
    // Signature elements
    export function createTypeParameterDeclaration(name: string | ts.Identifier, constraint?: ts.TypeNode, defaultType?: ts.TypeNode) {
        const node = (createSynthesizedNode(ts.SyntaxKind.TypeParameter) as ts.TypeParameterDeclaration);
        node.name = asName(name);
        node.constraint = constraint;
        node.default = defaultType;
        return node;
    }
    export function updateTypeParameterDeclaration(node: ts.TypeParameterDeclaration, name: ts.Identifier, constraint: ts.TypeNode | undefined, defaultType: ts.TypeNode | undefined) {
        return node.name !== name
            || node.constraint !== constraint
            || node.default !== defaultType
            ? updateNode(createTypeParameterDeclaration(name, constraint, defaultType), node)
            : node;
    }
    export function createParameter(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, dotDotDotToken: ts.DotDotDotToken | undefined, name: string | ts.BindingName, questionToken?: ts.QuestionToken, type?: ts.TypeNode, initializer?: ts.Expression) {
        const node = (<ts.ParameterDeclaration>createSynthesizedNode(ts.SyntaxKind.Parameter));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.dotDotDotToken = dotDotDotToken;
        node.name = asName(name);
        node.questionToken = questionToken;
        node.type = type;
        node.initializer = initializer ? ts.parenthesizeExpressionForList(initializer) : undefined;
        return node;
    }
    export function updateParameter(node: ts.ParameterDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, dotDotDotToken: ts.DotDotDotToken | undefined, name: string | ts.BindingName, questionToken: ts.QuestionToken | undefined, type: ts.TypeNode | undefined, initializer: ts.Expression | undefined) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.dotDotDotToken !== dotDotDotToken
            || node.name !== name
            || node.questionToken !== questionToken
            || node.type !== type
            || node.initializer !== initializer
            ? updateNode(createParameter(decorators, modifiers, dotDotDotToken, name, questionToken, type, initializer), node)
            : node;
    }
    export function createDecorator(expression: ts.Expression) {
        const node = (<ts.Decorator>createSynthesizedNode(ts.SyntaxKind.Decorator));
        node.expression = ts.parenthesizeForAccess(expression);
        return node;
    }
    export function updateDecorator(node: ts.Decorator, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createDecorator(expression), node)
            : node;
    }
    // Type Elements
    export function createPropertySignature(modifiers: readonly ts.Modifier[] | undefined, name: ts.PropertyName | string, questionToken: ts.QuestionToken | undefined, type: ts.TypeNode | undefined, initializer: ts.Expression | undefined): ts.PropertySignature {
        const node = (createSynthesizedNode(ts.SyntaxKind.PropertySignature) as ts.PropertySignature);
        node.modifiers = asNodeArray(modifiers);
        node.name = asName(name);
        node.questionToken = questionToken;
        node.type = type;
        node.initializer = initializer;
        return node;
    }
    export function updatePropertySignature(node: ts.PropertySignature, modifiers: readonly ts.Modifier[] | undefined, name: ts.PropertyName, questionToken: ts.QuestionToken | undefined, type: ts.TypeNode | undefined, initializer: ts.Expression | undefined) {
        return node.modifiers !== modifiers
            || node.name !== name
            || node.questionToken !== questionToken
            || node.type !== type
            || node.initializer !== initializer
            ? updateNode(createPropertySignature(modifiers, name, questionToken, type, initializer), node)
            : node;
    }
    export function createProperty(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: string | ts.PropertyName, questionOrExclamationToken: ts.QuestionToken | ts.ExclamationToken | undefined, type: ts.TypeNode | undefined, initializer: ts.Expression | undefined) {
        const node = (<ts.PropertyDeclaration>createSynthesizedNode(ts.SyntaxKind.PropertyDeclaration));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.name = asName(name);
        node.questionToken = questionOrExclamationToken !== undefined && questionOrExclamationToken.kind === ts.SyntaxKind.QuestionToken ? questionOrExclamationToken : undefined;
        node.exclamationToken = questionOrExclamationToken !== undefined && questionOrExclamationToken.kind === ts.SyntaxKind.ExclamationToken ? questionOrExclamationToken : undefined;
        node.type = type;
        node.initializer = initializer;
        return node;
    }
    export function updateProperty(node: ts.PropertyDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: string | ts.PropertyName, questionOrExclamationToken: ts.QuestionToken | ts.ExclamationToken | undefined, type: ts.TypeNode | undefined, initializer: ts.Expression | undefined) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.name !== name
            || node.questionToken !== (questionOrExclamationToken !== undefined && questionOrExclamationToken.kind === ts.SyntaxKind.QuestionToken ? questionOrExclamationToken : undefined)
            || node.exclamationToken !== (questionOrExclamationToken !== undefined && questionOrExclamationToken.kind === ts.SyntaxKind.ExclamationToken ? questionOrExclamationToken : undefined)
            || node.type !== type
            || node.initializer !== initializer
            ? updateNode(createProperty(decorators, modifiers, name, questionOrExclamationToken, type, initializer), node)
            : node;
    }
    export function createMethodSignature(typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, name: string | ts.PropertyName, questionToken: ts.QuestionToken | undefined) {
        const node = (createSignatureDeclaration(ts.SyntaxKind.MethodSignature, typeParameters, parameters, type) as ts.MethodSignature);
        node.name = asName(name);
        node.questionToken = questionToken;
        return node;
    }
    export function updateMethodSignature(node: ts.MethodSignature, typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined, parameters: ts.NodeArray<ts.ParameterDeclaration>, type: ts.TypeNode | undefined, name: ts.PropertyName, questionToken: ts.QuestionToken | undefined) {
        return node.typeParameters !== typeParameters
            || node.parameters !== parameters
            || node.type !== type
            || node.name !== name
            || node.questionToken !== questionToken
            ? updateNode(createMethodSignature(typeParameters, parameters, type, name, questionToken), node)
            : node;
    }
    export function createMethod(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, asteriskToken: ts.AsteriskToken | undefined, name: string | ts.PropertyName, questionToken: ts.QuestionToken | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, body: ts.Block | undefined) {
        const node = (<ts.MethodDeclaration>createSynthesizedNode(ts.SyntaxKind.MethodDeclaration));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.asteriskToken = asteriskToken;
        node.name = asName(name);
        node.questionToken = questionToken;
        node.typeParameters = asNodeArray(typeParameters);
        node.parameters = createNodeArray(parameters);
        node.type = type;
        node.body = body;
        return node;
    }
    function createMethodCall(object: ts.Expression, methodName: string | ts.Identifier, argumentsList: readonly ts.Expression[]) {
        return createCall(createPropertyAccess(object, asName(methodName)), 
        /*typeArguments*/ undefined, argumentsList);
    }
    function createGlobalMethodCall(globalObjectName: string, methodName: string, argumentsList: readonly ts.Expression[]) {
        return createMethodCall(createIdentifier(globalObjectName), methodName, argumentsList);
    }
    /* @internal */
    export function createObjectDefinePropertyCall(target: ts.Expression, propertyName: string | ts.Expression, attributes: ts.Expression) {
        return createGlobalMethodCall("Object", "defineProperty", [target, asExpression(propertyName), attributes]);
    }
    function tryAddPropertyAssignment(properties: ts.Push<ts.PropertyAssignment>, propertyName: string, expression: ts.Expression | undefined) {
        if (expression) {
            properties.push(createPropertyAssignment(propertyName, expression));
            return true;
        }
        return false;
    }
    /* @internal */
    export function createPropertyDescriptor(attributes: ts.PropertyDescriptorAttributes, singleLine?: boolean) {
        const properties: ts.PropertyAssignment[] = [];
        tryAddPropertyAssignment(properties, "enumerable", asExpression(attributes.enumerable));
        tryAddPropertyAssignment(properties, "configurable", asExpression(attributes.configurable));
        let isData = tryAddPropertyAssignment(properties, "writable", asExpression(attributes.writable));
        isData = tryAddPropertyAssignment(properties, "value", attributes.value) || isData;
        let isAccessor = tryAddPropertyAssignment(properties, "get", attributes.get);
        isAccessor = tryAddPropertyAssignment(properties, "set", attributes.set) || isAccessor;
        ts.Debug.assert(!(isData && isAccessor), "A PropertyDescriptor may not be both an accessor descriptor and a data descriptor.");
        return createObjectLiteral(properties, !singleLine);
    }
    export function updateMethod(node: ts.MethodDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, asteriskToken: ts.AsteriskToken | undefined, name: ts.PropertyName, questionToken: ts.QuestionToken | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, body: ts.Block | undefined) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.asteriskToken !== asteriskToken
            || node.name !== name
            || node.questionToken !== questionToken
            || node.typeParameters !== typeParameters
            || node.parameters !== parameters
            || node.type !== type
            || node.body !== body
            ? updateNode(createMethod(decorators, modifiers, asteriskToken, name, questionToken, typeParameters, parameters, type, body), node)
            : node;
    }
    export function createConstructor(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, parameters: readonly ts.ParameterDeclaration[], body: ts.Block | undefined) {
        const node = (<ts.ConstructorDeclaration>createSynthesizedNode(ts.SyntaxKind.Constructor));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.typeParameters = undefined;
        node.parameters = createNodeArray(parameters);
        node.type = undefined;
        node.body = body;
        return node;
    }
    export function updateConstructor(node: ts.ConstructorDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, parameters: readonly ts.ParameterDeclaration[], body: ts.Block | undefined) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.parameters !== parameters
            || node.body !== body
            ? updateNode(createConstructor(decorators, modifiers, parameters, body), node)
            : node;
    }
    export function createGetAccessor(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: string | ts.PropertyName, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, body: ts.Block | undefined) {
        const node = (<ts.GetAccessorDeclaration>createSynthesizedNode(ts.SyntaxKind.GetAccessor));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.name = asName(name);
        node.typeParameters = undefined;
        node.parameters = createNodeArray(parameters);
        node.type = type;
        node.body = body;
        return node;
    }
    export function updateGetAccessor(node: ts.GetAccessorDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: ts.PropertyName, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, body: ts.Block | undefined) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.name !== name
            || node.parameters !== parameters
            || node.type !== type
            || node.body !== body
            ? updateNode(createGetAccessor(decorators, modifiers, name, parameters, type, body), node)
            : node;
    }
    export function createSetAccessor(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: string | ts.PropertyName, parameters: readonly ts.ParameterDeclaration[], body: ts.Block | undefined) {
        const node = (<ts.SetAccessorDeclaration>createSynthesizedNode(ts.SyntaxKind.SetAccessor));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.name = asName(name);
        node.typeParameters = undefined;
        node.parameters = createNodeArray(parameters);
        node.body = body;
        return node;
    }
    export function updateSetAccessor(node: ts.SetAccessorDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: ts.PropertyName, parameters: readonly ts.ParameterDeclaration[], body: ts.Block | undefined) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.name !== name
            || node.parameters !== parameters
            || node.body !== body
            ? updateNode(createSetAccessor(decorators, modifiers, name, parameters, body), node)
            : node;
    }
    export function createCallSignature(typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined) {
        return createSignatureDeclaration(ts.SyntaxKind.CallSignature, typeParameters, parameters, type) as ts.CallSignatureDeclaration;
    }
    export function updateCallSignature(node: ts.CallSignatureDeclaration, typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined, parameters: ts.NodeArray<ts.ParameterDeclaration>, type: ts.TypeNode | undefined) {
        return updateSignatureDeclaration(node, typeParameters, parameters, type);
    }
    export function createConstructSignature(typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined) {
        return createSignatureDeclaration(ts.SyntaxKind.ConstructSignature, typeParameters, parameters, type) as ts.ConstructSignatureDeclaration;
    }
    export function updateConstructSignature(node: ts.ConstructSignatureDeclaration, typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined, parameters: ts.NodeArray<ts.ParameterDeclaration>, type: ts.TypeNode | undefined) {
        return updateSignatureDeclaration(node, typeParameters, parameters, type);
    }
    export function createIndexSignature(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode): ts.IndexSignatureDeclaration {
        const node = (createSynthesizedNode(ts.SyntaxKind.IndexSignature) as ts.IndexSignatureDeclaration);
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.parameters = createNodeArray(parameters);
        node.type = type;
        return node;
    }
    export function updateIndexSignature(node: ts.IndexSignatureDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode) {
        return node.parameters !== parameters
            || node.type !== type
            || node.decorators !== decorators
            || node.modifiers !== modifiers
            ? updateNode(createIndexSignature(decorators, modifiers, parameters, type), node)
            : node;
    }
    /* @internal */
    export function createSignatureDeclaration(kind: ts.SyntaxKind, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, typeArguments?: readonly ts.TypeNode[] | undefined) {
        const node = (createSynthesizedNode(kind) as ts.SignatureDeclaration);
        node.typeParameters = asNodeArray(typeParameters);
        node.parameters = asNodeArray(parameters);
        node.type = type;
        node.typeArguments = asNodeArray(typeArguments);
        return node;
    }
    function updateSignatureDeclaration<T extends ts.SignatureDeclaration>(node: T, typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined, parameters: ts.NodeArray<ts.ParameterDeclaration>, type: ts.TypeNode | undefined): T {
        return node.typeParameters !== typeParameters
            || node.parameters !== parameters
            || node.type !== type
            ? updateNode(<T>createSignatureDeclaration(node.kind, typeParameters, parameters, type), node)
            : node;
    }
    // Types
    export function createKeywordTypeNode(kind: ts.KeywordTypeNode["kind"]) {
        return <ts.KeywordTypeNode>createSynthesizedNode(kind);
    }
    export function createTypePredicateNode(parameterName: ts.Identifier | ts.ThisTypeNode | string, type: ts.TypeNode) {
        return createTypePredicateNodeWithModifier(/*assertsModifier*/ undefined, parameterName, type);
    }
    export function createTypePredicateNodeWithModifier(assertsModifier: ts.AssertsToken | undefined, parameterName: ts.Identifier | ts.ThisTypeNode | string, type: ts.TypeNode | undefined) {
        const node = (createSynthesizedNode(ts.SyntaxKind.TypePredicate) as ts.TypePredicateNode);
        node.assertsModifier = assertsModifier;
        node.parameterName = asName(parameterName);
        node.type = type;
        return node;
    }
    export function updateTypePredicateNode(node: ts.TypePredicateNode, parameterName: ts.Identifier | ts.ThisTypeNode, type: ts.TypeNode) {
        return updateTypePredicateNodeWithModifier(node, node.assertsModifier, parameterName, type);
    }
    export function updateTypePredicateNodeWithModifier(node: ts.TypePredicateNode, assertsModifier: ts.AssertsToken | undefined, parameterName: ts.Identifier | ts.ThisTypeNode, type: ts.TypeNode | undefined) {
        return node.assertsModifier !== assertsModifier
            || node.parameterName !== parameterName
            || node.type !== type
            ? updateNode(createTypePredicateNodeWithModifier(assertsModifier, parameterName, type), node)
            : node;
    }
    export function createTypeReferenceNode(typeName: string | ts.EntityName, typeArguments: readonly ts.TypeNode[] | undefined) {
        const node = (createSynthesizedNode(ts.SyntaxKind.TypeReference) as ts.TypeReferenceNode);
        node.typeName = asName(typeName);
        node.typeArguments = typeArguments && ts.parenthesizeTypeParameters(typeArguments);
        return node;
    }
    export function updateTypeReferenceNode(node: ts.TypeReferenceNode, typeName: ts.EntityName, typeArguments: ts.NodeArray<ts.TypeNode> | undefined) {
        return node.typeName !== typeName
            || node.typeArguments !== typeArguments
            ? updateNode(createTypeReferenceNode(typeName, typeArguments), node)
            : node;
    }
    export function createFunctionTypeNode(typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined) {
        return createSignatureDeclaration(ts.SyntaxKind.FunctionType, typeParameters, parameters, type) as ts.FunctionTypeNode;
    }
    export function updateFunctionTypeNode(node: ts.FunctionTypeNode, typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined, parameters: ts.NodeArray<ts.ParameterDeclaration>, type: ts.TypeNode | undefined) {
        return updateSignatureDeclaration(node, typeParameters, parameters, type);
    }
    export function createConstructorTypeNode(typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined) {
        return createSignatureDeclaration(ts.SyntaxKind.ConstructorType, typeParameters, parameters, type) as ts.ConstructorTypeNode;
    }
    export function updateConstructorTypeNode(node: ts.ConstructorTypeNode, typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined, parameters: ts.NodeArray<ts.ParameterDeclaration>, type: ts.TypeNode | undefined) {
        return updateSignatureDeclaration(node, typeParameters, parameters, type);
    }
    export function createTypeQueryNode(exprName: ts.EntityName) {
        const node = (createSynthesizedNode(ts.SyntaxKind.TypeQuery) as ts.TypeQueryNode);
        node.exprName = exprName;
        return node;
    }
    export function updateTypeQueryNode(node: ts.TypeQueryNode, exprName: ts.EntityName) {
        return node.exprName !== exprName
            ? updateNode(createTypeQueryNode(exprName), node)
            : node;
    }
    export function createTypeLiteralNode(members: readonly ts.TypeElement[] | undefined) {
        const node = (createSynthesizedNode(ts.SyntaxKind.TypeLiteral) as ts.TypeLiteralNode);
        node.members = createNodeArray(members);
        return node;
    }
    export function updateTypeLiteralNode(node: ts.TypeLiteralNode, members: ts.NodeArray<ts.TypeElement>) {
        return node.members !== members
            ? updateNode(createTypeLiteralNode(members), node)
            : node;
    }
    export function createArrayTypeNode(elementType: ts.TypeNode) {
        const node = (createSynthesizedNode(ts.SyntaxKind.ArrayType) as ts.ArrayTypeNode);
        node.elementType = ts.parenthesizeArrayTypeMember(elementType);
        return node;
    }
    export function updateArrayTypeNode(node: ts.ArrayTypeNode, elementType: ts.TypeNode): ts.ArrayTypeNode {
        return node.elementType !== elementType
            ? updateNode(createArrayTypeNode(elementType), node)
            : node;
    }
    export function createTupleTypeNode(elementTypes: readonly ts.TypeNode[]) {
        const node = (createSynthesizedNode(ts.SyntaxKind.TupleType) as ts.TupleTypeNode);
        node.elementTypes = createNodeArray(elementTypes);
        return node;
    }
    export function updateTupleTypeNode(node: ts.TupleTypeNode, elementTypes: readonly ts.TypeNode[]) {
        return node.elementTypes !== elementTypes
            ? updateNode(createTupleTypeNode(elementTypes), node)
            : node;
    }
    export function createOptionalTypeNode(type: ts.TypeNode) {
        const node = (createSynthesizedNode(ts.SyntaxKind.OptionalType) as ts.OptionalTypeNode);
        node.type = ts.parenthesizeArrayTypeMember(type);
        return node;
    }
    export function updateOptionalTypeNode(node: ts.OptionalTypeNode, type: ts.TypeNode): ts.OptionalTypeNode {
        return node.type !== type
            ? updateNode(createOptionalTypeNode(type), node)
            : node;
    }
    export function createRestTypeNode(type: ts.TypeNode) {
        const node = (createSynthesizedNode(ts.SyntaxKind.RestType) as ts.RestTypeNode);
        node.type = type;
        return node;
    }
    export function updateRestTypeNode(node: ts.RestTypeNode, type: ts.TypeNode): ts.RestTypeNode {
        return node.type !== type
            ? updateNode(createRestTypeNode(type), node)
            : node;
    }
    export function createUnionTypeNode(types: readonly ts.TypeNode[]): ts.UnionTypeNode {
        return <ts.UnionTypeNode>createUnionOrIntersectionTypeNode(ts.SyntaxKind.UnionType, types);
    }
    export function updateUnionTypeNode(node: ts.UnionTypeNode, types: ts.NodeArray<ts.TypeNode>) {
        return updateUnionOrIntersectionTypeNode(node, types);
    }
    export function createIntersectionTypeNode(types: readonly ts.TypeNode[]): ts.IntersectionTypeNode {
        return <ts.IntersectionTypeNode>createUnionOrIntersectionTypeNode(ts.SyntaxKind.IntersectionType, types);
    }
    export function updateIntersectionTypeNode(node: ts.IntersectionTypeNode, types: ts.NodeArray<ts.TypeNode>) {
        return updateUnionOrIntersectionTypeNode(node, types);
    }
    export function createUnionOrIntersectionTypeNode(kind: ts.SyntaxKind.UnionType | ts.SyntaxKind.IntersectionType, types: readonly ts.TypeNode[]) {
        const node = (createSynthesizedNode(kind) as ts.UnionTypeNode | ts.IntersectionTypeNode);
        node.types = ts.parenthesizeElementTypeMembers(types);
        return node;
    }
    function updateUnionOrIntersectionTypeNode<T extends ts.UnionOrIntersectionTypeNode>(node: T, types: ts.NodeArray<ts.TypeNode>): T {
        return node.types !== types
            ? updateNode(<T>createUnionOrIntersectionTypeNode(node.kind, types), node)
            : node;
    }
    export function createConditionalTypeNode(checkType: ts.TypeNode, extendsType: ts.TypeNode, trueType: ts.TypeNode, falseType: ts.TypeNode) {
        const node = (createSynthesizedNode(ts.SyntaxKind.ConditionalType) as ts.ConditionalTypeNode);
        node.checkType = ts.parenthesizeConditionalTypeMember(checkType);
        node.extendsType = ts.parenthesizeConditionalTypeMember(extendsType);
        node.trueType = trueType;
        node.falseType = falseType;
        return node;
    }
    export function updateConditionalTypeNode(node: ts.ConditionalTypeNode, checkType: ts.TypeNode, extendsType: ts.TypeNode, trueType: ts.TypeNode, falseType: ts.TypeNode) {
        return node.checkType !== checkType
            || node.extendsType !== extendsType
            || node.trueType !== trueType
            || node.falseType !== falseType
            ? updateNode(createConditionalTypeNode(checkType, extendsType, trueType, falseType), node)
            : node;
    }
    export function createInferTypeNode(typeParameter: ts.TypeParameterDeclaration) {
        const node = (<ts.InferTypeNode>createSynthesizedNode(ts.SyntaxKind.InferType));
        node.typeParameter = typeParameter;
        return node;
    }
    export function updateInferTypeNode(node: ts.InferTypeNode, typeParameter: ts.TypeParameterDeclaration) {
        return node.typeParameter !== typeParameter
            ? updateNode(createInferTypeNode(typeParameter), node)
            : node;
    }
    export function createImportTypeNode(argument: ts.TypeNode, qualifier?: ts.EntityName, typeArguments?: readonly ts.TypeNode[], isTypeOf?: boolean) {
        const node = (<ts.ImportTypeNode>createSynthesizedNode(ts.SyntaxKind.ImportType));
        node.argument = argument;
        node.qualifier = qualifier;
        node.typeArguments = ts.parenthesizeTypeParameters(typeArguments);
        node.isTypeOf = isTypeOf;
        return node;
    }
    export function updateImportTypeNode(node: ts.ImportTypeNode, argument: ts.TypeNode, qualifier?: ts.EntityName, typeArguments?: readonly ts.TypeNode[], isTypeOf?: boolean) {
        return node.argument !== argument
            || node.qualifier !== qualifier
            || node.typeArguments !== typeArguments
            || node.isTypeOf !== isTypeOf
            ? updateNode(createImportTypeNode(argument, qualifier, typeArguments, isTypeOf), node)
            : node;
    }
    export function createParenthesizedType(type: ts.TypeNode) {
        const node = (<ts.ParenthesizedTypeNode>createSynthesizedNode(ts.SyntaxKind.ParenthesizedType));
        node.type = type;
        return node;
    }
    export function updateParenthesizedType(node: ts.ParenthesizedTypeNode, type: ts.TypeNode) {
        return node.type !== type
            ? updateNode(createParenthesizedType(type), node)
            : node;
    }
    export function createThisTypeNode() {
        return <ts.ThisTypeNode>createSynthesizedNode(ts.SyntaxKind.ThisType);
    }
    export function createTypeOperatorNode(type: ts.TypeNode): ts.TypeOperatorNode;
    export function createTypeOperatorNode(operator: ts.SyntaxKind.KeyOfKeyword | ts.SyntaxKind.UniqueKeyword | ts.SyntaxKind.ReadonlyKeyword, type: ts.TypeNode): ts.TypeOperatorNode;
    export function createTypeOperatorNode(operatorOrType: ts.SyntaxKind.KeyOfKeyword | ts.SyntaxKind.UniqueKeyword | ts.SyntaxKind.ReadonlyKeyword | ts.TypeNode, type?: ts.TypeNode) {
        const node = (createSynthesizedNode(ts.SyntaxKind.TypeOperator) as ts.TypeOperatorNode);
        node.operator = typeof operatorOrType === "number" ? operatorOrType : ts.SyntaxKind.KeyOfKeyword;
        node.type = ts.parenthesizeElementTypeMember(typeof operatorOrType === "number" ? type! : operatorOrType);
        return node;
    }
    export function updateTypeOperatorNode(node: ts.TypeOperatorNode, type: ts.TypeNode) {
        return node.type !== type ? updateNode(createTypeOperatorNode(node.operator, type), node) : node;
    }
    export function createIndexedAccessTypeNode(objectType: ts.TypeNode, indexType: ts.TypeNode) {
        const node = (createSynthesizedNode(ts.SyntaxKind.IndexedAccessType) as ts.IndexedAccessTypeNode);
        node.objectType = ts.parenthesizeElementTypeMember(objectType);
        node.indexType = indexType;
        return node;
    }
    export function updateIndexedAccessTypeNode(node: ts.IndexedAccessTypeNode, objectType: ts.TypeNode, indexType: ts.TypeNode) {
        return node.objectType !== objectType
            || node.indexType !== indexType
            ? updateNode(createIndexedAccessTypeNode(objectType, indexType), node)
            : node;
    }
    export function createMappedTypeNode(readonlyToken: ts.ReadonlyToken | ts.PlusToken | ts.MinusToken | undefined, typeParameter: ts.TypeParameterDeclaration, questionToken: ts.QuestionToken | ts.PlusToken | ts.MinusToken | undefined, type: ts.TypeNode | undefined): ts.MappedTypeNode {
        const node = (createSynthesizedNode(ts.SyntaxKind.MappedType) as ts.MappedTypeNode);
        node.readonlyToken = readonlyToken;
        node.typeParameter = typeParameter;
        node.questionToken = questionToken;
        node.type = type;
        return node;
    }
    export function updateMappedTypeNode(node: ts.MappedTypeNode, readonlyToken: ts.ReadonlyToken | ts.PlusToken | ts.MinusToken | undefined, typeParameter: ts.TypeParameterDeclaration, questionToken: ts.QuestionToken | ts.PlusToken | ts.MinusToken | undefined, type: ts.TypeNode | undefined): ts.MappedTypeNode {
        return node.readonlyToken !== readonlyToken
            || node.typeParameter !== typeParameter
            || node.questionToken !== questionToken
            || node.type !== type
            ? updateNode(createMappedTypeNode(readonlyToken, typeParameter, questionToken, type), node)
            : node;
    }
    export function createLiteralTypeNode(literal: ts.LiteralTypeNode["literal"]) {
        const node = (createSynthesizedNode(ts.SyntaxKind.LiteralType) as ts.LiteralTypeNode);
        node.literal = literal;
        return node;
    }
    export function updateLiteralTypeNode(node: ts.LiteralTypeNode, literal: ts.LiteralTypeNode["literal"]) {
        return node.literal !== literal
            ? updateNode(createLiteralTypeNode(literal), node)
            : node;
    }
    // Binding Patterns
    export function createObjectBindingPattern(elements: readonly ts.BindingElement[]) {
        const node = (<ts.ObjectBindingPattern>createSynthesizedNode(ts.SyntaxKind.ObjectBindingPattern));
        node.elements = createNodeArray(elements);
        return node;
    }
    export function updateObjectBindingPattern(node: ts.ObjectBindingPattern, elements: readonly ts.BindingElement[]) {
        return node.elements !== elements
            ? updateNode(createObjectBindingPattern(elements), node)
            : node;
    }
    export function createArrayBindingPattern(elements: readonly ts.ArrayBindingElement[]) {
        const node = (<ts.ArrayBindingPattern>createSynthesizedNode(ts.SyntaxKind.ArrayBindingPattern));
        node.elements = createNodeArray(elements);
        return node;
    }
    export function updateArrayBindingPattern(node: ts.ArrayBindingPattern, elements: readonly ts.ArrayBindingElement[]) {
        return node.elements !== elements
            ? updateNode(createArrayBindingPattern(elements), node)
            : node;
    }
    export function createBindingElement(dotDotDotToken: ts.DotDotDotToken | undefined, propertyName: string | ts.PropertyName | undefined, name: string | ts.BindingName, initializer?: ts.Expression) {
        const node = (<ts.BindingElement>createSynthesizedNode(ts.SyntaxKind.BindingElement));
        node.dotDotDotToken = dotDotDotToken;
        node.propertyName = asName(propertyName);
        node.name = asName(name);
        node.initializer = initializer;
        return node;
    }
    export function updateBindingElement(node: ts.BindingElement, dotDotDotToken: ts.DotDotDotToken | undefined, propertyName: ts.PropertyName | undefined, name: ts.BindingName, initializer: ts.Expression | undefined) {
        return node.propertyName !== propertyName
            || node.dotDotDotToken !== dotDotDotToken
            || node.name !== name
            || node.initializer !== initializer
            ? updateNode(createBindingElement(dotDotDotToken, propertyName, name, initializer), node)
            : node;
    }
    // Expression
    export function createArrayLiteral(elements?: readonly ts.Expression[], multiLine?: boolean) {
        const node = (<ts.ArrayLiteralExpression>createSynthesizedNode(ts.SyntaxKind.ArrayLiteralExpression));
        node.elements = ts.parenthesizeListElements(createNodeArray(elements));
        if (multiLine)
            node.multiLine = true;
        return node;
    }
    export function updateArrayLiteral(node: ts.ArrayLiteralExpression, elements: readonly ts.Expression[]) {
        return node.elements !== elements
            ? updateNode(createArrayLiteral(elements, node.multiLine), node)
            : node;
    }
    export function createObjectLiteral(properties?: readonly ts.ObjectLiteralElementLike[], multiLine?: boolean) {
        const node = (<ts.ObjectLiteralExpression>createSynthesizedNode(ts.SyntaxKind.ObjectLiteralExpression));
        node.properties = createNodeArray(properties);
        if (multiLine)
            node.multiLine = true;
        return node;
    }
    export function updateObjectLiteral(node: ts.ObjectLiteralExpression, properties: readonly ts.ObjectLiteralElementLike[]) {
        return node.properties !== properties
            ? updateNode(createObjectLiteral(properties, node.multiLine), node)
            : node;
    }
    export function createPropertyAccess(expression: ts.Expression, name: string | ts.Identifier) {
        const node = (<ts.PropertyAccessExpression>createSynthesizedNode(ts.SyntaxKind.PropertyAccessExpression));
        node.expression = ts.parenthesizeForAccess(expression);
        node.name = asName(name);
        setEmitFlags(node, ts.EmitFlags.NoIndentation);
        return node;
    }
    export function updatePropertyAccess(node: ts.PropertyAccessExpression, expression: ts.Expression, name: ts.Identifier) {
        if (ts.isOptionalChain(node)) {
            return updatePropertyAccessChain(node, expression, node.questionDotToken, name);
        }
        // Because we are updating existed propertyAccess we want to inherit its emitFlags
        // instead of using the default from createPropertyAccess
        return node.expression !== expression
            || node.name !== name
            ? updateNode(setEmitFlags(createPropertyAccess(expression, name), ts.getEmitFlags(node)), node)
            : node;
    }
    export function createPropertyAccessChain(expression: ts.Expression, questionDotToken: ts.QuestionDotToken | undefined, name: string | ts.Identifier) {
        const node = (<ts.PropertyAccessChain>createSynthesizedNode(ts.SyntaxKind.PropertyAccessExpression));
        node.flags |= ts.NodeFlags.OptionalChain;
        node.expression = ts.parenthesizeForAccess(expression);
        node.questionDotToken = questionDotToken;
        node.name = asName(name);
        setEmitFlags(node, ts.EmitFlags.NoIndentation);
        return node;
    }
    export function updatePropertyAccessChain(node: ts.PropertyAccessChain, expression: ts.Expression, questionDotToken: ts.QuestionDotToken | undefined, name: ts.Identifier) {
        ts.Debug.assert(!!(node.flags & ts.NodeFlags.OptionalChain), "Cannot update a PropertyAccessExpression using updatePropertyAccessChain. Use updatePropertyAccess instead.");
        // Because we are updating an existing PropertyAccessChain we want to inherit its emitFlags
        // instead of using the default from createPropertyAccess
        return node.expression !== expression
            || node.questionDotToken !== questionDotToken
            || node.name !== name
            ? updateNode(setEmitFlags(createPropertyAccessChain(expression, questionDotToken, name), ts.getEmitFlags(node)), node)
            : node;
    }
    export function createElementAccess(expression: ts.Expression, index: number | ts.Expression) {
        const node = (<ts.ElementAccessExpression>createSynthesizedNode(ts.SyntaxKind.ElementAccessExpression));
        node.expression = ts.parenthesizeForAccess(expression);
        node.argumentExpression = asExpression(index);
        return node;
    }
    export function updateElementAccess(node: ts.ElementAccessExpression, expression: ts.Expression, argumentExpression: ts.Expression) {
        if (ts.isOptionalChain(node)) {
            return updateElementAccessChain(node, expression, node.questionDotToken, argumentExpression);
        }
        return node.expression !== expression
            || node.argumentExpression !== argumentExpression
            ? updateNode(createElementAccess(expression, argumentExpression), node)
            : node;
    }
    export function createElementAccessChain(expression: ts.Expression, questionDotToken: ts.QuestionDotToken | undefined, index: number | ts.Expression) {
        const node = (<ts.ElementAccessChain>createSynthesizedNode(ts.SyntaxKind.ElementAccessExpression));
        node.flags |= ts.NodeFlags.OptionalChain;
        node.expression = ts.parenthesizeForAccess(expression);
        node.questionDotToken = questionDotToken;
        node.argumentExpression = asExpression(index);
        return node;
    }
    export function updateElementAccessChain(node: ts.ElementAccessChain, expression: ts.Expression, questionDotToken: ts.QuestionDotToken | undefined, argumentExpression: ts.Expression) {
        ts.Debug.assert(!!(node.flags & ts.NodeFlags.OptionalChain), "Cannot update an ElementAccessExpression using updateElementAccessChain. Use updateElementAccess instead.");
        return node.expression !== expression
            || node.questionDotToken !== questionDotToken
            || node.argumentExpression !== argumentExpression
            ? updateNode(createElementAccessChain(expression, questionDotToken, argumentExpression), node)
            : node;
    }
    export function createCall(expression: ts.Expression, typeArguments: readonly ts.TypeNode[] | undefined, argumentsArray: readonly ts.Expression[] | undefined) {
        const node = (<ts.CallExpression>createSynthesizedNode(ts.SyntaxKind.CallExpression));
        node.expression = ts.parenthesizeForAccess(expression);
        node.typeArguments = asNodeArray(typeArguments);
        node.arguments = ts.parenthesizeListElements(createNodeArray(argumentsArray));
        return node;
    }
    export function updateCall(node: ts.CallExpression, expression: ts.Expression, typeArguments: readonly ts.TypeNode[] | undefined, argumentsArray: readonly ts.Expression[]) {
        if (ts.isOptionalChain(node)) {
            return updateCallChain(node, expression, node.questionDotToken, typeArguments, argumentsArray);
        }
        return node.expression !== expression
            || node.typeArguments !== typeArguments
            || node.arguments !== argumentsArray
            ? updateNode(createCall(expression, typeArguments, argumentsArray), node)
            : node;
    }
    export function createCallChain(expression: ts.Expression, questionDotToken: ts.QuestionDotToken | undefined, typeArguments: readonly ts.TypeNode[] | undefined, argumentsArray: readonly ts.Expression[] | undefined) {
        const node = (<ts.CallChain>createSynthesizedNode(ts.SyntaxKind.CallExpression));
        node.flags |= ts.NodeFlags.OptionalChain;
        node.expression = ts.parenthesizeForAccess(expression);
        node.questionDotToken = questionDotToken;
        node.typeArguments = asNodeArray(typeArguments);
        node.arguments = ts.parenthesizeListElements(createNodeArray(argumentsArray));
        return node;
    }
    export function updateCallChain(node: ts.CallChain, expression: ts.Expression, questionDotToken: ts.QuestionDotToken | undefined, typeArguments: readonly ts.TypeNode[] | undefined, argumentsArray: readonly ts.Expression[]) {
        ts.Debug.assert(!!(node.flags & ts.NodeFlags.OptionalChain), "Cannot update a CallExpression using updateCallChain. Use updateCall instead.");
        return node.expression !== expression
            || node.questionDotToken !== questionDotToken
            || node.typeArguments !== typeArguments
            || node.arguments !== argumentsArray
            ? updateNode(createCallChain(expression, questionDotToken, typeArguments, argumentsArray), node)
            : node;
    }
    export function createNew(expression: ts.Expression, typeArguments: readonly ts.TypeNode[] | undefined, argumentsArray: readonly ts.Expression[] | undefined) {
        const node = (<ts.NewExpression>createSynthesizedNode(ts.SyntaxKind.NewExpression));
        node.expression = ts.parenthesizeForNew(expression);
        node.typeArguments = asNodeArray(typeArguments);
        node.arguments = argumentsArray ? ts.parenthesizeListElements(createNodeArray(argumentsArray)) : undefined;
        return node;
    }
    export function updateNew(node: ts.NewExpression, expression: ts.Expression, typeArguments: readonly ts.TypeNode[] | undefined, argumentsArray: readonly ts.Expression[] | undefined) {
        return node.expression !== expression
            || node.typeArguments !== typeArguments
            || node.arguments !== argumentsArray
            ? updateNode(createNew(expression, typeArguments, argumentsArray), node)
            : node;
    }
    /** @deprecated */ export function createTaggedTemplate(tag: ts.Expression, template: ts.TemplateLiteral): ts.TaggedTemplateExpression;
    export function createTaggedTemplate(tag: ts.Expression, typeArguments: readonly ts.TypeNode[] | undefined, template: ts.TemplateLiteral): ts.TaggedTemplateExpression;
    /** @internal */
    export function createTaggedTemplate(tag: ts.Expression, typeArgumentsOrTemplate: readonly ts.TypeNode[] | ts.TemplateLiteral | undefined, template?: ts.TemplateLiteral): ts.TaggedTemplateExpression;
    export function createTaggedTemplate(tag: ts.Expression, typeArgumentsOrTemplate: readonly ts.TypeNode[] | ts.TemplateLiteral | undefined, template?: ts.TemplateLiteral) {
        const node = (<ts.TaggedTemplateExpression>createSynthesizedNode(ts.SyntaxKind.TaggedTemplateExpression));
        node.tag = ts.parenthesizeForAccess(tag);
        if (template) {
            node.typeArguments = asNodeArray((typeArgumentsOrTemplate as readonly ts.TypeNode[]));
            node.template = template;
        }
        else {
            node.typeArguments = undefined;
            node.template = (typeArgumentsOrTemplate as ts.TemplateLiteral);
        }
        return node;
    }
    /** @deprecated */ export function updateTaggedTemplate(node: ts.TaggedTemplateExpression, tag: ts.Expression, template: ts.TemplateLiteral): ts.TaggedTemplateExpression;
    export function updateTaggedTemplate(node: ts.TaggedTemplateExpression, tag: ts.Expression, typeArguments: readonly ts.TypeNode[] | undefined, template: ts.TemplateLiteral): ts.TaggedTemplateExpression;
    export function updateTaggedTemplate(node: ts.TaggedTemplateExpression, tag: ts.Expression, typeArgumentsOrTemplate: readonly ts.TypeNode[] | ts.TemplateLiteral | undefined, template?: ts.TemplateLiteral) {
        return node.tag !== tag
            || (template
                ? node.typeArguments !== typeArgumentsOrTemplate || node.template !== template
                : node.typeArguments !== undefined || node.template !== typeArgumentsOrTemplate)
            ? updateNode(createTaggedTemplate(tag, typeArgumentsOrTemplate, template), node)
            : node;
    }
    export function createTypeAssertion(type: ts.TypeNode, expression: ts.Expression) {
        const node = (<ts.TypeAssertion>createSynthesizedNode(ts.SyntaxKind.TypeAssertionExpression));
        node.type = type;
        node.expression = ts.parenthesizePrefixOperand(expression);
        return node;
    }
    export function updateTypeAssertion(node: ts.TypeAssertion, type: ts.TypeNode, expression: ts.Expression) {
        return node.type !== type
            || node.expression !== expression
            ? updateNode(createTypeAssertion(type, expression), node)
            : node;
    }
    export function createParen(expression: ts.Expression) {
        const node = (<ts.ParenthesizedExpression>createSynthesizedNode(ts.SyntaxKind.ParenthesizedExpression));
        node.expression = expression;
        return node;
    }
    export function updateParen(node: ts.ParenthesizedExpression, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createParen(expression), node)
            : node;
    }
    export function createFunctionExpression(modifiers: readonly ts.Modifier[] | undefined, asteriskToken: ts.AsteriskToken | undefined, name: string | ts.Identifier | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[] | undefined, type: ts.TypeNode | undefined, body: ts.Block) {
        const node = (<ts.FunctionExpression>createSynthesizedNode(ts.SyntaxKind.FunctionExpression));
        node.modifiers = asNodeArray(modifiers);
        node.asteriskToken = asteriskToken;
        node.name = asName(name);
        node.typeParameters = asNodeArray(typeParameters);
        node.parameters = createNodeArray(parameters);
        node.type = type;
        node.body = body;
        return node;
    }
    export function updateFunctionExpression(node: ts.FunctionExpression, modifiers: readonly ts.Modifier[] | undefined, asteriskToken: ts.AsteriskToken | undefined, name: ts.Identifier | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, body: ts.Block) {
        return node.name !== name
            || node.modifiers !== modifiers
            || node.asteriskToken !== asteriskToken
            || node.typeParameters !== typeParameters
            || node.parameters !== parameters
            || node.type !== type
            || node.body !== body
            ? updateNode(createFunctionExpression(modifiers, asteriskToken, name, typeParameters, parameters, type, body), node)
            : node;
    }
    export function createArrowFunction(modifiers: readonly ts.Modifier[] | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, equalsGreaterThanToken: ts.EqualsGreaterThanToken | undefined, body: ts.ConciseBody) {
        const node = (<ts.ArrowFunction>createSynthesizedNode(ts.SyntaxKind.ArrowFunction));
        node.modifiers = asNodeArray(modifiers);
        node.typeParameters = asNodeArray(typeParameters);
        node.parameters = createNodeArray(parameters);
        node.type = type;
        node.equalsGreaterThanToken = equalsGreaterThanToken || createToken(ts.SyntaxKind.EqualsGreaterThanToken);
        node.body = ts.parenthesizeConciseBody(body);
        return node;
    }
    export function updateArrowFunction(node: ts.ArrowFunction, modifiers: readonly ts.Modifier[] | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, equalsGreaterThanToken: ts.Token<ts.SyntaxKind.EqualsGreaterThanToken>, body: ts.ConciseBody): ts.ArrowFunction {
        return node.modifiers !== modifiers
            || node.typeParameters !== typeParameters
            || node.parameters !== parameters
            || node.type !== type
            || node.equalsGreaterThanToken !== equalsGreaterThanToken
            || node.body !== body
            ? updateNode(createArrowFunction(modifiers, typeParameters, parameters, type, equalsGreaterThanToken, body), node)
            : node;
    }
    export function createDelete(expression: ts.Expression) {
        const node = (<ts.DeleteExpression>createSynthesizedNode(ts.SyntaxKind.DeleteExpression));
        node.expression = ts.parenthesizePrefixOperand(expression);
        return node;
    }
    export function updateDelete(node: ts.DeleteExpression, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createDelete(expression), node)
            : node;
    }
    export function createTypeOf(expression: ts.Expression) {
        const node = (<ts.TypeOfExpression>createSynthesizedNode(ts.SyntaxKind.TypeOfExpression));
        node.expression = ts.parenthesizePrefixOperand(expression);
        return node;
    }
    export function updateTypeOf(node: ts.TypeOfExpression, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createTypeOf(expression), node)
            : node;
    }
    export function createVoid(expression: ts.Expression) {
        const node = (<ts.VoidExpression>createSynthesizedNode(ts.SyntaxKind.VoidExpression));
        node.expression = ts.parenthesizePrefixOperand(expression);
        return node;
    }
    export function updateVoid(node: ts.VoidExpression, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createVoid(expression), node)
            : node;
    }
    export function createAwait(expression: ts.Expression) {
        const node = (<ts.AwaitExpression>createSynthesizedNode(ts.SyntaxKind.AwaitExpression));
        node.expression = ts.parenthesizePrefixOperand(expression);
        return node;
    }
    export function updateAwait(node: ts.AwaitExpression, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createAwait(expression), node)
            : node;
    }
    export function createPrefix(operator: ts.PrefixUnaryOperator, operand: ts.Expression) {
        const node = (<ts.PrefixUnaryExpression>createSynthesizedNode(ts.SyntaxKind.PrefixUnaryExpression));
        node.operator = operator;
        node.operand = ts.parenthesizePrefixOperand(operand);
        return node;
    }
    export function updatePrefix(node: ts.PrefixUnaryExpression, operand: ts.Expression) {
        return node.operand !== operand
            ? updateNode(createPrefix(node.operator, operand), node)
            : node;
    }
    export function createPostfix(operand: ts.Expression, operator: ts.PostfixUnaryOperator) {
        const node = (<ts.PostfixUnaryExpression>createSynthesizedNode(ts.SyntaxKind.PostfixUnaryExpression));
        node.operand = ts.parenthesizePostfixOperand(operand);
        node.operator = operator;
        return node;
    }
    export function updatePostfix(node: ts.PostfixUnaryExpression, operand: ts.Expression) {
        return node.operand !== operand
            ? updateNode(createPostfix(operand, node.operator), node)
            : node;
    }
    export function createBinary(left: ts.Expression, operator: ts.BinaryOperator | ts.BinaryOperatorToken, right: ts.Expression) {
        const node = (<ts.BinaryExpression>createSynthesizedNode(ts.SyntaxKind.BinaryExpression));
        const operatorToken = asToken(operator);
        const operatorKind = operatorToken.kind;
        node.left = ts.parenthesizeBinaryOperand(operatorKind, left, /*isLeftSideOfBinary*/ true, /*leftOperand*/ undefined);
        node.operatorToken = operatorToken;
        node.right = ts.parenthesizeBinaryOperand(operatorKind, right, /*isLeftSideOfBinary*/ false, node.left);
        return node;
    }
    export function updateBinary(node: ts.BinaryExpression, left: ts.Expression, right: ts.Expression, operator?: ts.BinaryOperator | ts.BinaryOperatorToken) {
        return node.left !== left
            || node.right !== right
            ? updateNode(createBinary(left, operator || node.operatorToken, right), node)
            : node;
    }
    /** @deprecated */ export function createConditional(condition: ts.Expression, whenTrue: ts.Expression, whenFalse: ts.Expression): ts.ConditionalExpression;
    export function createConditional(condition: ts.Expression, questionToken: ts.QuestionToken, whenTrue: ts.Expression, colonToken: ts.ColonToken, whenFalse: ts.Expression): ts.ConditionalExpression;
    export function createConditional(condition: ts.Expression, questionTokenOrWhenTrue: ts.QuestionToken | ts.Expression, whenTrueOrWhenFalse: ts.Expression, colonToken?: ts.ColonToken, whenFalse?: ts.Expression) {
        const node = (<ts.ConditionalExpression>createSynthesizedNode(ts.SyntaxKind.ConditionalExpression));
        node.condition = ts.parenthesizeForConditionalHead(condition);
        node.questionToken = whenFalse ? <ts.QuestionToken>questionTokenOrWhenTrue : createToken(ts.SyntaxKind.QuestionToken);
        node.whenTrue = ts.parenthesizeSubexpressionOfConditionalExpression(whenFalse ? whenTrueOrWhenFalse : <ts.Expression>questionTokenOrWhenTrue);
        node.colonToken = whenFalse ? colonToken! : createToken(ts.SyntaxKind.ColonToken);
        node.whenFalse = ts.parenthesizeSubexpressionOfConditionalExpression(whenFalse ? whenFalse : whenTrueOrWhenFalse);
        return node;
    }
    export function updateConditional(node: ts.ConditionalExpression, condition: ts.Expression, questionToken: ts.Token<ts.SyntaxKind.QuestionToken>, whenTrue: ts.Expression, colonToken: ts.Token<ts.SyntaxKind.ColonToken>, whenFalse: ts.Expression): ts.ConditionalExpression {
        return node.condition !== condition
            || node.questionToken !== questionToken
            || node.whenTrue !== whenTrue
            || node.colonToken !== colonToken
            || node.whenFalse !== whenFalse
            ? updateNode(createConditional(condition, questionToken, whenTrue, colonToken, whenFalse), node)
            : node;
    }
    export function createTemplateExpression(head: ts.TemplateHead, templateSpans: readonly ts.TemplateSpan[]) {
        const node = (<ts.TemplateExpression>createSynthesizedNode(ts.SyntaxKind.TemplateExpression));
        node.head = head;
        node.templateSpans = createNodeArray(templateSpans);
        return node;
    }
    export function updateTemplateExpression(node: ts.TemplateExpression, head: ts.TemplateHead, templateSpans: readonly ts.TemplateSpan[]) {
        return node.head !== head
            || node.templateSpans !== templateSpans
            ? updateNode(createTemplateExpression(head, templateSpans), node)
            : node;
    }
    let rawTextScanner: ts.Scanner | undefined;
    const invalidValueSentinel: object = {};
    function getCookedText(kind: ts.TemplateLiteralToken["kind"], rawText: string) {
        if (!rawTextScanner) {
            rawTextScanner = ts.createScanner(ts.ScriptTarget.Latest, /*skipTrivia*/ false, ts.LanguageVariant.Standard);
        }
        switch (kind) {
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                rawTextScanner.setText("`" + rawText + "`");
                break;
            case ts.SyntaxKind.TemplateHead:
                rawTextScanner.setText("`" + rawText + "${");
                break;
            case ts.SyntaxKind.TemplateMiddle:
                rawTextScanner.setText("}" + rawText + "${");
                break;
            case ts.SyntaxKind.TemplateTail:
                rawTextScanner.setText("}" + rawText + "`");
                break;
        }
        let token = rawTextScanner.scan();
        if (token === ts.SyntaxKind.CloseBracketToken) {
            token = rawTextScanner.reScanTemplateToken();
        }
        if (rawTextScanner.isUnterminated()) {
            rawTextScanner.setText(undefined);
            return invalidValueSentinel;
        }
        let tokenValue: string | undefined;
        switch (token) {
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.TemplateHead:
            case ts.SyntaxKind.TemplateMiddle:
            case ts.SyntaxKind.TemplateTail:
                tokenValue = rawTextScanner.getTokenValue();
                break;
        }
        if (rawTextScanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
            rawTextScanner.setText(undefined);
            return invalidValueSentinel;
        }
        rawTextScanner.setText(undefined);
        return tokenValue;
    }
    function createTemplateLiteralLikeNode(kind: ts.TemplateLiteralToken["kind"], text: string, rawText: string | undefined) {
        const node = (<ts.TemplateLiteralLikeNode>createSynthesizedNode(kind));
        node.text = text;
        if (rawText === undefined || text === rawText) {
            node.rawText = rawText;
        }
        else {
            const cooked = getCookedText(kind, rawText);
            if (typeof cooked === "object") {
                return ts.Debug.fail("Invalid raw text");
            }
            ts.Debug.assert(text === cooked, "Expected argument 'text' to be the normalized (i.e. 'cooked') version of argument 'rawText'.");
            node.rawText = rawText;
        }
        return node;
    }
    export function createTemplateHead(text: string, rawText?: string) {
        const node = (<ts.TemplateHead>createTemplateLiteralLikeNode(ts.SyntaxKind.TemplateHead, text, rawText));
        node.text = text;
        return node;
    }
    export function createTemplateMiddle(text: string, rawText?: string) {
        const node = (<ts.TemplateMiddle>createTemplateLiteralLikeNode(ts.SyntaxKind.TemplateMiddle, text, rawText));
        node.text = text;
        return node;
    }
    export function createTemplateTail(text: string, rawText?: string) {
        const node = (<ts.TemplateTail>createTemplateLiteralLikeNode(ts.SyntaxKind.TemplateTail, text, rawText));
        node.text = text;
        return node;
    }
    export function createNoSubstitutionTemplateLiteral(text: string, rawText?: string) {
        const node = (<ts.NoSubstitutionTemplateLiteral>createTemplateLiteralLikeNode(ts.SyntaxKind.NoSubstitutionTemplateLiteral, text, rawText));
        return node;
    }
    export function createYield(expression?: ts.Expression): ts.YieldExpression;
    export function createYield(asteriskToken: ts.AsteriskToken | undefined, expression: ts.Expression): ts.YieldExpression;
    export function createYield(asteriskTokenOrExpression?: ts.AsteriskToken | undefined | ts.Expression, expression?: ts.Expression) {
        const node = (<ts.YieldExpression>createSynthesizedNode(ts.SyntaxKind.YieldExpression));
        node.asteriskToken = asteriskTokenOrExpression && asteriskTokenOrExpression.kind === ts.SyntaxKind.AsteriskToken ? <ts.AsteriskToken>asteriskTokenOrExpression : undefined;
        node.expression = asteriskTokenOrExpression && asteriskTokenOrExpression.kind !== ts.SyntaxKind.AsteriskToken ? asteriskTokenOrExpression : expression;
        return node;
    }
    export function updateYield(node: ts.YieldExpression, asteriskToken: ts.AsteriskToken | undefined, expression: ts.Expression) {
        return node.expression !== expression
            || node.asteriskToken !== asteriskToken
            ? updateNode(createYield(asteriskToken, expression), node)
            : node;
    }
    export function createSpread(expression: ts.Expression) {
        const node = (<ts.SpreadElement>createSynthesizedNode(ts.SyntaxKind.SpreadElement));
        node.expression = ts.parenthesizeExpressionForList(expression);
        return node;
    }
    export function updateSpread(node: ts.SpreadElement, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createSpread(expression), node)
            : node;
    }
    export function createClassExpression(modifiers: readonly ts.Modifier[] | undefined, name: string | ts.Identifier | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, heritageClauses: readonly ts.HeritageClause[] | undefined, members: readonly ts.ClassElement[]) {
        const node = (<ts.ClassExpression>createSynthesizedNode(ts.SyntaxKind.ClassExpression));
        node.decorators = undefined;
        node.modifiers = asNodeArray(modifiers);
        node.name = asName(name);
        node.typeParameters = asNodeArray(typeParameters);
        node.heritageClauses = asNodeArray(heritageClauses);
        node.members = createNodeArray(members);
        return node;
    }
    export function updateClassExpression(node: ts.ClassExpression, modifiers: readonly ts.Modifier[] | undefined, name: ts.Identifier | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, heritageClauses: readonly ts.HeritageClause[] | undefined, members: readonly ts.ClassElement[]) {
        return node.modifiers !== modifiers
            || node.name !== name
            || node.typeParameters !== typeParameters
            || node.heritageClauses !== heritageClauses
            || node.members !== members
            ? updateNode(createClassExpression(modifiers, name, typeParameters, heritageClauses, members), node)
            : node;
    }
    export function createOmittedExpression() {
        return <ts.OmittedExpression>createSynthesizedNode(ts.SyntaxKind.OmittedExpression);
    }
    export function createExpressionWithTypeArguments(typeArguments: readonly ts.TypeNode[] | undefined, expression: ts.Expression) {
        const node = (<ts.ExpressionWithTypeArguments>createSynthesizedNode(ts.SyntaxKind.ExpressionWithTypeArguments));
        node.expression = ts.parenthesizeForAccess(expression);
        node.typeArguments = asNodeArray(typeArguments);
        return node;
    }
    export function updateExpressionWithTypeArguments(node: ts.ExpressionWithTypeArguments, typeArguments: readonly ts.TypeNode[] | undefined, expression: ts.Expression) {
        return node.typeArguments !== typeArguments
            || node.expression !== expression
            ? updateNode(createExpressionWithTypeArguments(typeArguments, expression), node)
            : node;
    }
    export function createAsExpression(expression: ts.Expression, type: ts.TypeNode) {
        const node = (<ts.AsExpression>createSynthesizedNode(ts.SyntaxKind.AsExpression));
        node.expression = expression;
        node.type = type;
        return node;
    }
    export function updateAsExpression(node: ts.AsExpression, expression: ts.Expression, type: ts.TypeNode) {
        return node.expression !== expression
            || node.type !== type
            ? updateNode(createAsExpression(expression, type), node)
            : node;
    }
    export function createNonNullExpression(expression: ts.Expression) {
        const node = (<ts.NonNullExpression>createSynthesizedNode(ts.SyntaxKind.NonNullExpression));
        node.expression = ts.parenthesizeForAccess(expression);
        return node;
    }
    export function updateNonNullExpression(node: ts.NonNullExpression, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createNonNullExpression(expression), node)
            : node;
    }
    export function createMetaProperty(keywordToken: ts.MetaProperty["keywordToken"], name: ts.Identifier) {
        const node = (<ts.MetaProperty>createSynthesizedNode(ts.SyntaxKind.MetaProperty));
        node.keywordToken = keywordToken;
        node.name = name;
        return node;
    }
    export function updateMetaProperty(node: ts.MetaProperty, name: ts.Identifier) {
        return node.name !== name
            ? updateNode(createMetaProperty(node.keywordToken, name), node)
            : node;
    }
    // Misc
    export function createTemplateSpan(expression: ts.Expression, literal: ts.TemplateMiddle | ts.TemplateTail) {
        const node = (<ts.TemplateSpan>createSynthesizedNode(ts.SyntaxKind.TemplateSpan));
        node.expression = expression;
        node.literal = literal;
        return node;
    }
    export function updateTemplateSpan(node: ts.TemplateSpan, expression: ts.Expression, literal: ts.TemplateMiddle | ts.TemplateTail) {
        return node.expression !== expression
            || node.literal !== literal
            ? updateNode(createTemplateSpan(expression, literal), node)
            : node;
    }
    export function createSemicolonClassElement() {
        return <ts.SemicolonClassElement>createSynthesizedNode(ts.SyntaxKind.SemicolonClassElement);
    }
    // Element
    export function createBlock(statements: readonly ts.Statement[], multiLine?: boolean): ts.Block {
        const block = (<ts.Block>createSynthesizedNode(ts.SyntaxKind.Block));
        block.statements = createNodeArray(statements);
        if (multiLine)
            block.multiLine = multiLine;
        return block;
    }
    export function updateBlock(node: ts.Block, statements: readonly ts.Statement[]) {
        return node.statements !== statements
            ? updateNode(createBlock(statements, node.multiLine), node)
            : node;
    }
    export function createVariableStatement(modifiers: readonly ts.Modifier[] | undefined, declarationList: ts.VariableDeclarationList | readonly ts.VariableDeclaration[]) {
        const node = (<ts.VariableStatement>createSynthesizedNode(ts.SyntaxKind.VariableStatement));
        node.decorators = undefined;
        node.modifiers = asNodeArray(modifiers);
        node.declarationList = ts.isArray(declarationList) ? createVariableDeclarationList(declarationList) : declarationList;
        return node;
    }
    export function updateVariableStatement(node: ts.VariableStatement, modifiers: readonly ts.Modifier[] | undefined, declarationList: ts.VariableDeclarationList) {
        return node.modifiers !== modifiers
            || node.declarationList !== declarationList
            ? updateNode(createVariableStatement(modifiers, declarationList), node)
            : node;
    }
    export function createEmptyStatement() {
        return <ts.EmptyStatement>createSynthesizedNode(ts.SyntaxKind.EmptyStatement);
    }
    export function createExpressionStatement(expression: ts.Expression): ts.ExpressionStatement {
        const node = (<ts.ExpressionStatement>createSynthesizedNode(ts.SyntaxKind.ExpressionStatement));
        node.expression = ts.parenthesizeExpressionForExpressionStatement(expression);
        return node;
    }
    export function updateExpressionStatement(node: ts.ExpressionStatement, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createExpressionStatement(expression), node)
            : node;
    }
    /** @deprecated Use `createExpressionStatement` instead.  */
    export const createStatement = createExpressionStatement;
    /** @deprecated Use `updateExpressionStatement` instead.  */
    export const updateStatement = updateExpressionStatement;
    export function createIf(expression: ts.Expression, thenStatement: ts.Statement, elseStatement?: ts.Statement) {
        const node = (<ts.IfStatement>createSynthesizedNode(ts.SyntaxKind.IfStatement));
        node.expression = expression;
        node.thenStatement = asEmbeddedStatement(thenStatement);
        node.elseStatement = asEmbeddedStatement(elseStatement);
        return node;
    }
    export function updateIf(node: ts.IfStatement, expression: ts.Expression, thenStatement: ts.Statement, elseStatement: ts.Statement | undefined) {
        return node.expression !== expression
            || node.thenStatement !== thenStatement
            || node.elseStatement !== elseStatement
            ? updateNode(createIf(expression, thenStatement, elseStatement), node)
            : node;
    }
    export function createDo(statement: ts.Statement, expression: ts.Expression) {
        const node = (<ts.DoStatement>createSynthesizedNode(ts.SyntaxKind.DoStatement));
        node.statement = asEmbeddedStatement(statement);
        node.expression = expression;
        return node;
    }
    export function updateDo(node: ts.DoStatement, statement: ts.Statement, expression: ts.Expression) {
        return node.statement !== statement
            || node.expression !== expression
            ? updateNode(createDo(statement, expression), node)
            : node;
    }
    export function createWhile(expression: ts.Expression, statement: ts.Statement) {
        const node = (<ts.WhileStatement>createSynthesizedNode(ts.SyntaxKind.WhileStatement));
        node.expression = expression;
        node.statement = asEmbeddedStatement(statement);
        return node;
    }
    export function updateWhile(node: ts.WhileStatement, expression: ts.Expression, statement: ts.Statement) {
        return node.expression !== expression
            || node.statement !== statement
            ? updateNode(createWhile(expression, statement), node)
            : node;
    }
    export function createFor(initializer: ts.ForInitializer | undefined, condition: ts.Expression | undefined, incrementor: ts.Expression | undefined, statement: ts.Statement) {
        const node = (<ts.ForStatement>createSynthesizedNode(ts.SyntaxKind.ForStatement));
        node.initializer = initializer;
        node.condition = condition;
        node.incrementor = incrementor;
        node.statement = asEmbeddedStatement(statement);
        return node;
    }
    export function updateFor(node: ts.ForStatement, initializer: ts.ForInitializer | undefined, condition: ts.Expression | undefined, incrementor: ts.Expression | undefined, statement: ts.Statement) {
        return node.initializer !== initializer
            || node.condition !== condition
            || node.incrementor !== incrementor
            || node.statement !== statement
            ? updateNode(createFor(initializer, condition, incrementor, statement), node)
            : node;
    }
    export function createForIn(initializer: ts.ForInitializer, expression: ts.Expression, statement: ts.Statement) {
        const node = (<ts.ForInStatement>createSynthesizedNode(ts.SyntaxKind.ForInStatement));
        node.initializer = initializer;
        node.expression = expression;
        node.statement = asEmbeddedStatement(statement);
        return node;
    }
    export function updateForIn(node: ts.ForInStatement, initializer: ts.ForInitializer, expression: ts.Expression, statement: ts.Statement) {
        return node.initializer !== initializer
            || node.expression !== expression
            || node.statement !== statement
            ? updateNode(createForIn(initializer, expression, statement), node)
            : node;
    }
    export function createForOf(awaitModifier: ts.AwaitKeywordToken | undefined, initializer: ts.ForInitializer, expression: ts.Expression, statement: ts.Statement) {
        const node = (<ts.ForOfStatement>createSynthesizedNode(ts.SyntaxKind.ForOfStatement));
        node.awaitModifier = awaitModifier;
        node.initializer = initializer;
        node.expression = ts.isCommaSequence(expression) ? createParen(expression) : expression;
        node.statement = asEmbeddedStatement(statement);
        return node;
    }
    export function updateForOf(node: ts.ForOfStatement, awaitModifier: ts.AwaitKeywordToken | undefined, initializer: ts.ForInitializer, expression: ts.Expression, statement: ts.Statement) {
        return node.awaitModifier !== awaitModifier
            || node.initializer !== initializer
            || node.expression !== expression
            || node.statement !== statement
            ? updateNode(createForOf(awaitModifier, initializer, expression, statement), node)
            : node;
    }
    export function createContinue(label?: string | ts.Identifier): ts.ContinueStatement {
        const node = (<ts.ContinueStatement>createSynthesizedNode(ts.SyntaxKind.ContinueStatement));
        node.label = asName(label);
        return node;
    }
    export function updateContinue(node: ts.ContinueStatement, label: ts.Identifier | undefined) {
        return node.label !== label
            ? updateNode(createContinue(label), node)
            : node;
    }
    export function createBreak(label?: string | ts.Identifier): ts.BreakStatement {
        const node = (<ts.BreakStatement>createSynthesizedNode(ts.SyntaxKind.BreakStatement));
        node.label = asName(label);
        return node;
    }
    export function updateBreak(node: ts.BreakStatement, label: ts.Identifier | undefined) {
        return node.label !== label
            ? updateNode(createBreak(label), node)
            : node;
    }
    export function createReturn(expression?: ts.Expression): ts.ReturnStatement {
        const node = (<ts.ReturnStatement>createSynthesizedNode(ts.SyntaxKind.ReturnStatement));
        node.expression = expression;
        return node;
    }
    export function updateReturn(node: ts.ReturnStatement, expression: ts.Expression | undefined) {
        return node.expression !== expression
            ? updateNode(createReturn(expression), node)
            : node;
    }
    export function createWith(expression: ts.Expression, statement: ts.Statement) {
        const node = (<ts.WithStatement>createSynthesizedNode(ts.SyntaxKind.WithStatement));
        node.expression = expression;
        node.statement = asEmbeddedStatement(statement);
        return node;
    }
    export function updateWith(node: ts.WithStatement, expression: ts.Expression, statement: ts.Statement) {
        return node.expression !== expression
            || node.statement !== statement
            ? updateNode(createWith(expression, statement), node)
            : node;
    }
    export function createSwitch(expression: ts.Expression, caseBlock: ts.CaseBlock): ts.SwitchStatement {
        const node = (<ts.SwitchStatement>createSynthesizedNode(ts.SyntaxKind.SwitchStatement));
        node.expression = ts.parenthesizeExpressionForList(expression);
        node.caseBlock = caseBlock;
        return node;
    }
    export function updateSwitch(node: ts.SwitchStatement, expression: ts.Expression, caseBlock: ts.CaseBlock) {
        return node.expression !== expression
            || node.caseBlock !== caseBlock
            ? updateNode(createSwitch(expression, caseBlock), node)
            : node;
    }
    export function createLabel(label: string | ts.Identifier, statement: ts.Statement) {
        const node = (<ts.LabeledStatement>createSynthesizedNode(ts.SyntaxKind.LabeledStatement));
        node.label = asName(label);
        node.statement = asEmbeddedStatement(statement);
        return node;
    }
    export function updateLabel(node: ts.LabeledStatement, label: ts.Identifier, statement: ts.Statement) {
        return node.label !== label
            || node.statement !== statement
            ? updateNode(createLabel(label, statement), node)
            : node;
    }
    export function createThrow(expression: ts.Expression) {
        const node = (<ts.ThrowStatement>createSynthesizedNode(ts.SyntaxKind.ThrowStatement));
        node.expression = expression;
        return node;
    }
    export function updateThrow(node: ts.ThrowStatement, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createThrow(expression), node)
            : node;
    }
    export function createTry(tryBlock: ts.Block, catchClause: ts.CatchClause | undefined, finallyBlock: ts.Block | undefined) {
        const node = (<ts.TryStatement>createSynthesizedNode(ts.SyntaxKind.TryStatement));
        node.tryBlock = tryBlock;
        node.catchClause = catchClause;
        node.finallyBlock = finallyBlock;
        return node;
    }
    export function updateTry(node: ts.TryStatement, tryBlock: ts.Block, catchClause: ts.CatchClause | undefined, finallyBlock: ts.Block | undefined) {
        return node.tryBlock !== tryBlock
            || node.catchClause !== catchClause
            || node.finallyBlock !== finallyBlock
            ? updateNode(createTry(tryBlock, catchClause, finallyBlock), node)
            : node;
    }
    export function createDebuggerStatement() {
        return <ts.DebuggerStatement>createSynthesizedNode(ts.SyntaxKind.DebuggerStatement);
    }
    export function createVariableDeclaration(name: string | ts.BindingName, type?: ts.TypeNode, initializer?: ts.Expression) {
        /* Internally, one should probably use createTypeScriptVariableDeclaration instead and handle definite assignment assertions */
        const node = (<ts.VariableDeclaration>createSynthesizedNode(ts.SyntaxKind.VariableDeclaration));
        node.name = asName(name);
        node.type = type;
        node.initializer = initializer !== undefined ? ts.parenthesizeExpressionForList(initializer) : undefined;
        return node;
    }
    export function updateVariableDeclaration(node: ts.VariableDeclaration, name: ts.BindingName, type: ts.TypeNode | undefined, initializer: ts.Expression | undefined) {
        /* Internally, one should probably use updateTypeScriptVariableDeclaration instead and handle definite assignment assertions */
        return node.name !== name
            || node.type !== type
            || node.initializer !== initializer
            ? updateNode(createVariableDeclaration(name, type, initializer), node)
            : node;
    }
    /* @internal */
    export function createTypeScriptVariableDeclaration(name: string | ts.BindingName, exclaimationToken?: ts.Token<ts.SyntaxKind.ExclamationToken>, type?: ts.TypeNode, initializer?: ts.Expression) {
        const node = (<ts.VariableDeclaration>createSynthesizedNode(ts.SyntaxKind.VariableDeclaration));
        node.name = asName(name);
        node.type = type;
        node.initializer = initializer !== undefined ? ts.parenthesizeExpressionForList(initializer) : undefined;
        node.exclamationToken = exclaimationToken;
        return node;
    }
    /* @internal */
    export function updateTypeScriptVariableDeclaration(node: ts.VariableDeclaration, name: ts.BindingName, exclaimationToken: ts.Token<ts.SyntaxKind.ExclamationToken> | undefined, type: ts.TypeNode | undefined, initializer: ts.Expression | undefined) {
        return node.name !== name
            || node.type !== type
            || node.initializer !== initializer
            || node.exclamationToken !== exclaimationToken
            ? updateNode(createTypeScriptVariableDeclaration(name, exclaimationToken, type, initializer), node)
            : node;
    }
    export function createVariableDeclarationList(declarations: readonly ts.VariableDeclaration[], flags = ts.NodeFlags.None) {
        const node = (<ts.VariableDeclarationList>createSynthesizedNode(ts.SyntaxKind.VariableDeclarationList));
        node.flags |= flags & ts.NodeFlags.BlockScoped;
        node.declarations = createNodeArray(declarations);
        return node;
    }
    export function updateVariableDeclarationList(node: ts.VariableDeclarationList, declarations: readonly ts.VariableDeclaration[]) {
        return node.declarations !== declarations
            ? updateNode(createVariableDeclarationList(declarations, node.flags), node)
            : node;
    }
    export function createFunctionDeclaration(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, asteriskToken: ts.AsteriskToken | undefined, name: string | ts.Identifier | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, body: ts.Block | undefined) {
        const node = (<ts.FunctionDeclaration>createSynthesizedNode(ts.SyntaxKind.FunctionDeclaration));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.asteriskToken = asteriskToken;
        node.name = asName(name);
        node.typeParameters = asNodeArray(typeParameters);
        node.parameters = createNodeArray(parameters);
        node.type = type;
        node.body = body;
        return node;
    }
    export function updateFunctionDeclaration(node: ts.FunctionDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, asteriskToken: ts.AsteriskToken | undefined, name: ts.Identifier | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined, body: ts.Block | undefined) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.asteriskToken !== asteriskToken
            || node.name !== name
            || node.typeParameters !== typeParameters
            || node.parameters !== parameters
            || node.type !== type
            || node.body !== body
            ? updateNode(createFunctionDeclaration(decorators, modifiers, asteriskToken, name, typeParameters, parameters, type, body), node)
            : node;
    }
    export function createClassDeclaration(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: string | ts.Identifier | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, heritageClauses: readonly ts.HeritageClause[] | undefined, members: readonly ts.ClassElement[]) {
        const node = (<ts.ClassDeclaration>createSynthesizedNode(ts.SyntaxKind.ClassDeclaration));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.name = asName(name);
        node.typeParameters = asNodeArray(typeParameters);
        node.heritageClauses = asNodeArray(heritageClauses);
        node.members = createNodeArray(members);
        return node;
    }
    export function updateClassDeclaration(node: ts.ClassDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: ts.Identifier | undefined, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, heritageClauses: readonly ts.HeritageClause[] | undefined, members: readonly ts.ClassElement[]) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.name !== name
            || node.typeParameters !== typeParameters
            || node.heritageClauses !== heritageClauses
            || node.members !== members
            ? updateNode(createClassDeclaration(decorators, modifiers, name, typeParameters, heritageClauses, members), node)
            : node;
    }
    export function createInterfaceDeclaration(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: string | ts.Identifier, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, heritageClauses: readonly ts.HeritageClause[] | undefined, members: readonly ts.TypeElement[]) {
        const node = (<ts.InterfaceDeclaration>createSynthesizedNode(ts.SyntaxKind.InterfaceDeclaration));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.name = asName(name);
        node.typeParameters = asNodeArray(typeParameters);
        node.heritageClauses = asNodeArray(heritageClauses);
        node.members = createNodeArray(members);
        return node;
    }
    export function updateInterfaceDeclaration(node: ts.InterfaceDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: ts.Identifier, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, heritageClauses: readonly ts.HeritageClause[] | undefined, members: readonly ts.TypeElement[]) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.name !== name
            || node.typeParameters !== typeParameters
            || node.heritageClauses !== heritageClauses
            || node.members !== members
            ? updateNode(createInterfaceDeclaration(decorators, modifiers, name, typeParameters, heritageClauses, members), node)
            : node;
    }
    export function createTypeAliasDeclaration(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: string | ts.Identifier, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, type: ts.TypeNode) {
        const node = (<ts.TypeAliasDeclaration>createSynthesizedNode(ts.SyntaxKind.TypeAliasDeclaration));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.name = asName(name);
        node.typeParameters = asNodeArray(typeParameters);
        node.type = type;
        return node;
    }
    export function updateTypeAliasDeclaration(node: ts.TypeAliasDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: ts.Identifier, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, type: ts.TypeNode) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.name !== name
            || node.typeParameters !== typeParameters
            || node.type !== type
            ? updateNode(createTypeAliasDeclaration(decorators, modifiers, name, typeParameters, type), node)
            : node;
    }
    export function createEnumDeclaration(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: string | ts.Identifier, members: readonly ts.EnumMember[]) {
        const node = (<ts.EnumDeclaration>createSynthesizedNode(ts.SyntaxKind.EnumDeclaration));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.name = asName(name);
        node.members = createNodeArray(members);
        return node;
    }
    export function updateEnumDeclaration(node: ts.EnumDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: ts.Identifier, members: readonly ts.EnumMember[]) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.name !== name
            || node.members !== members
            ? updateNode(createEnumDeclaration(decorators, modifiers, name, members), node)
            : node;
    }
    export function createModuleDeclaration(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: ts.ModuleName, body: ts.ModuleBody | undefined, flags = ts.NodeFlags.None) {
        const node = (<ts.ModuleDeclaration>createSynthesizedNode(ts.SyntaxKind.ModuleDeclaration));
        node.flags |= flags & (ts.NodeFlags.Namespace | ts.NodeFlags.NestedNamespace | ts.NodeFlags.GlobalAugmentation);
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.name = name;
        node.body = body;
        return node;
    }
    export function updateModuleDeclaration(node: ts.ModuleDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: ts.ModuleName, body: ts.ModuleBody | undefined) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.name !== name
            || node.body !== body
            ? updateNode(createModuleDeclaration(decorators, modifiers, name, body, node.flags), node)
            : node;
    }
    export function createModuleBlock(statements: readonly ts.Statement[]) {
        const node = (<ts.ModuleBlock>createSynthesizedNode(ts.SyntaxKind.ModuleBlock));
        node.statements = createNodeArray(statements);
        return node;
    }
    export function updateModuleBlock(node: ts.ModuleBlock, statements: readonly ts.Statement[]) {
        return node.statements !== statements
            ? updateNode(createModuleBlock(statements), node)
            : node;
    }
    export function createCaseBlock(clauses: readonly ts.CaseOrDefaultClause[]): ts.CaseBlock {
        const node = (<ts.CaseBlock>createSynthesizedNode(ts.SyntaxKind.CaseBlock));
        node.clauses = createNodeArray(clauses);
        return node;
    }
    export function updateCaseBlock(node: ts.CaseBlock, clauses: readonly ts.CaseOrDefaultClause[]) {
        return node.clauses !== clauses
            ? updateNode(createCaseBlock(clauses), node)
            : node;
    }
    export function createNamespaceExportDeclaration(name: string | ts.Identifier) {
        const node = (<ts.NamespaceExportDeclaration>createSynthesizedNode(ts.SyntaxKind.NamespaceExportDeclaration));
        node.name = asName(name);
        return node;
    }
    export function updateNamespaceExportDeclaration(node: ts.NamespaceExportDeclaration, name: ts.Identifier) {
        return node.name !== name
            ? updateNode(createNamespaceExportDeclaration(name), node)
            : node;
    }
    export function createImportEqualsDeclaration(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: string | ts.Identifier, moduleReference: ts.ModuleReference) {
        const node = (<ts.ImportEqualsDeclaration>createSynthesizedNode(ts.SyntaxKind.ImportEqualsDeclaration));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.name = asName(name);
        node.moduleReference = moduleReference;
        return node;
    }
    export function updateImportEqualsDeclaration(node: ts.ImportEqualsDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, name: ts.Identifier, moduleReference: ts.ModuleReference) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.name !== name
            || node.moduleReference !== moduleReference
            ? updateNode(createImportEqualsDeclaration(decorators, modifiers, name, moduleReference), node)
            : node;
    }
    export function createImportDeclaration(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, importClause: ts.ImportClause | undefined, moduleSpecifier: ts.Expression): ts.ImportDeclaration {
        const node = (<ts.ImportDeclaration>createSynthesizedNode(ts.SyntaxKind.ImportDeclaration));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.importClause = importClause;
        node.moduleSpecifier = moduleSpecifier;
        return node;
    }
    export function updateImportDeclaration(node: ts.ImportDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, importClause: ts.ImportClause | undefined, moduleSpecifier: ts.Expression) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.importClause !== importClause
            || node.moduleSpecifier !== moduleSpecifier
            ? updateNode(createImportDeclaration(decorators, modifiers, importClause, moduleSpecifier), node)
            : node;
    }
    export function createImportClause(name: ts.Identifier | undefined, namedBindings: ts.NamedImportBindings | undefined): ts.ImportClause {
        const node = (<ts.ImportClause>createSynthesizedNode(ts.SyntaxKind.ImportClause));
        node.name = name;
        node.namedBindings = namedBindings;
        return node;
    }
    export function updateImportClause(node: ts.ImportClause, name: ts.Identifier | undefined, namedBindings: ts.NamedImportBindings | undefined) {
        return node.name !== name
            || node.namedBindings !== namedBindings
            ? updateNode(createImportClause(name, namedBindings), node)
            : node;
    }
    export function createNamespaceImport(name: ts.Identifier): ts.NamespaceImport {
        const node = (<ts.NamespaceImport>createSynthesizedNode(ts.SyntaxKind.NamespaceImport));
        node.name = name;
        return node;
    }
    export function updateNamespaceImport(node: ts.NamespaceImport, name: ts.Identifier) {
        return node.name !== name
            ? updateNode(createNamespaceImport(name), node)
            : node;
    }
    export function createNamedImports(elements: readonly ts.ImportSpecifier[]): ts.NamedImports {
        const node = (<ts.NamedImports>createSynthesizedNode(ts.SyntaxKind.NamedImports));
        node.elements = createNodeArray(elements);
        return node;
    }
    export function updateNamedImports(node: ts.NamedImports, elements: readonly ts.ImportSpecifier[]) {
        return node.elements !== elements
            ? updateNode(createNamedImports(elements), node)
            : node;
    }
    export function createImportSpecifier(propertyName: ts.Identifier | undefined, name: ts.Identifier) {
        const node = (<ts.ImportSpecifier>createSynthesizedNode(ts.SyntaxKind.ImportSpecifier));
        node.propertyName = propertyName;
        node.name = name;
        return node;
    }
    export function updateImportSpecifier(node: ts.ImportSpecifier, propertyName: ts.Identifier | undefined, name: ts.Identifier) {
        return node.propertyName !== propertyName
            || node.name !== name
            ? updateNode(createImportSpecifier(propertyName, name), node)
            : node;
    }
    export function createExportAssignment(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, isExportEquals: boolean | undefined, expression: ts.Expression) {
        const node = (<ts.ExportAssignment>createSynthesizedNode(ts.SyntaxKind.ExportAssignment));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.isExportEquals = isExportEquals;
        node.expression = isExportEquals ? ts.parenthesizeBinaryOperand(ts.SyntaxKind.EqualsToken, expression, /*isLeftSideOfBinary*/ false, /*leftOperand*/ undefined) : ts.parenthesizeDefaultExpression(expression);
        return node;
    }
    export function updateExportAssignment(node: ts.ExportAssignment, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, expression: ts.Expression) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.expression !== expression
            ? updateNode(createExportAssignment(decorators, modifiers, node.isExportEquals, expression), node)
            : node;
    }
    export function createExportDeclaration(decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, exportClause: ts.NamedExports | undefined, moduleSpecifier?: ts.Expression) {
        const node = (<ts.ExportDeclaration>createSynthesizedNode(ts.SyntaxKind.ExportDeclaration));
        node.decorators = asNodeArray(decorators);
        node.modifiers = asNodeArray(modifiers);
        node.exportClause = exportClause;
        node.moduleSpecifier = moduleSpecifier;
        return node;
    }
    export function updateExportDeclaration(node: ts.ExportDeclaration, decorators: readonly ts.Decorator[] | undefined, modifiers: readonly ts.Modifier[] | undefined, exportClause: ts.NamedExports | undefined, moduleSpecifier: ts.Expression | undefined) {
        return node.decorators !== decorators
            || node.modifiers !== modifiers
            || node.exportClause !== exportClause
            || node.moduleSpecifier !== moduleSpecifier
            ? updateNode(createExportDeclaration(decorators, modifiers, exportClause, moduleSpecifier), node)
            : node;
    }
    /* @internal */
    export function createEmptyExports() {
        return createExportDeclaration(/*decorators*/ undefined, /*modifiers*/ undefined, createNamedExports([]), /*moduleSpecifier*/ undefined);
    }
    export function createNamedExports(elements: readonly ts.ExportSpecifier[]) {
        const node = (<ts.NamedExports>createSynthesizedNode(ts.SyntaxKind.NamedExports));
        node.elements = createNodeArray(elements);
        return node;
    }
    export function updateNamedExports(node: ts.NamedExports, elements: readonly ts.ExportSpecifier[]) {
        return node.elements !== elements
            ? updateNode(createNamedExports(elements), node)
            : node;
    }
    export function createExportSpecifier(propertyName: string | ts.Identifier | undefined, name: string | ts.Identifier) {
        const node = (<ts.ExportSpecifier>createSynthesizedNode(ts.SyntaxKind.ExportSpecifier));
        node.propertyName = asName(propertyName);
        node.name = asName(name);
        return node;
    }
    export function updateExportSpecifier(node: ts.ExportSpecifier, propertyName: ts.Identifier | undefined, name: ts.Identifier) {
        return node.propertyName !== propertyName
            || node.name !== name
            ? updateNode(createExportSpecifier(propertyName, name), node)
            : node;
    }
    // Module references
    export function createExternalModuleReference(expression: ts.Expression) {
        const node = (<ts.ExternalModuleReference>createSynthesizedNode(ts.SyntaxKind.ExternalModuleReference));
        node.expression = expression;
        return node;
    }
    export function updateExternalModuleReference(node: ts.ExternalModuleReference, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createExternalModuleReference(expression), node)
            : node;
    }
    // JSDoc
    /* @internal */
    export function createJSDocTypeExpression(type: ts.TypeNode): ts.JSDocTypeExpression {
        const node = (createSynthesizedNode(ts.SyntaxKind.JSDocTypeExpression) as ts.JSDocTypeExpression);
        node.type = type;
        return node;
    }
    /* @internal */
    export function createJSDocTypeTag(typeExpression: ts.JSDocTypeExpression, comment?: string): ts.JSDocTypeTag {
        const tag = createJSDocTag<ts.JSDocTypeTag>(ts.SyntaxKind.JSDocTypeTag, "type");
        tag.typeExpression = typeExpression;
        tag.comment = comment;
        return tag;
    }
    /* @internal */
    export function createJSDocReturnTag(typeExpression?: ts.JSDocTypeExpression, comment?: string): ts.JSDocReturnTag {
        const tag = createJSDocTag<ts.JSDocReturnTag>(ts.SyntaxKind.JSDocReturnTag, "returns");
        tag.typeExpression = typeExpression;
        tag.comment = comment;
        return tag;
    }
    /** @internal */
    export function createJSDocThisTag(typeExpression?: ts.JSDocTypeExpression): ts.JSDocThisTag {
        const tag = createJSDocTag<ts.JSDocThisTag>(ts.SyntaxKind.JSDocThisTag, "this");
        tag.typeExpression = typeExpression;
        return tag;
    }
    /* @internal */
    export function createJSDocParamTag(name: ts.EntityName, isBracketed: boolean, typeExpression?: ts.JSDocTypeExpression, comment?: string): ts.JSDocParameterTag {
        const tag = createJSDocTag<ts.JSDocParameterTag>(ts.SyntaxKind.JSDocParameterTag, "param");
        tag.typeExpression = typeExpression;
        tag.name = name;
        tag.isBracketed = isBracketed;
        tag.comment = comment;
        return tag;
    }
    /* @internal */
    export function createJSDocComment(comment?: string | undefined, tags?: ts.NodeArray<ts.JSDocTag> | undefined) {
        const node = (createSynthesizedNode(ts.SyntaxKind.JSDocComment) as ts.JSDoc);
        node.comment = comment;
        node.tags = tags;
        return node;
    }
    /* @internal */
    function createJSDocTag<T extends ts.JSDocTag>(kind: T["kind"], tagName: string): T {
        const node = createSynthesizedNode(kind) as T;
        node.tagName = createIdentifier(tagName);
        return node;
    }
    // JSX
    export function createJsxElement(openingElement: ts.JsxOpeningElement, children: readonly ts.JsxChild[], closingElement: ts.JsxClosingElement) {
        const node = (<ts.JsxElement>createSynthesizedNode(ts.SyntaxKind.JsxElement));
        node.openingElement = openingElement;
        node.children = createNodeArray(children);
        node.closingElement = closingElement;
        return node;
    }
    export function updateJsxElement(node: ts.JsxElement, openingElement: ts.JsxOpeningElement, children: readonly ts.JsxChild[], closingElement: ts.JsxClosingElement) {
        return node.openingElement !== openingElement
            || node.children !== children
            || node.closingElement !== closingElement
            ? updateNode(createJsxElement(openingElement, children, closingElement), node)
            : node;
    }
    export function createJsxSelfClosingElement(tagName: ts.JsxTagNameExpression, typeArguments: readonly ts.TypeNode[] | undefined, attributes: ts.JsxAttributes) {
        const node = (<ts.JsxSelfClosingElement>createSynthesizedNode(ts.SyntaxKind.JsxSelfClosingElement));
        node.tagName = tagName;
        node.typeArguments = asNodeArray(typeArguments);
        node.attributes = attributes;
        return node;
    }
    export function updateJsxSelfClosingElement(node: ts.JsxSelfClosingElement, tagName: ts.JsxTagNameExpression, typeArguments: readonly ts.TypeNode[] | undefined, attributes: ts.JsxAttributes) {
        return node.tagName !== tagName
            || node.typeArguments !== typeArguments
            || node.attributes !== attributes
            ? updateNode(createJsxSelfClosingElement(tagName, typeArguments, attributes), node)
            : node;
    }
    export function createJsxOpeningElement(tagName: ts.JsxTagNameExpression, typeArguments: readonly ts.TypeNode[] | undefined, attributes: ts.JsxAttributes) {
        const node = (<ts.JsxOpeningElement>createSynthesizedNode(ts.SyntaxKind.JsxOpeningElement));
        node.tagName = tagName;
        node.typeArguments = asNodeArray(typeArguments);
        node.attributes = attributes;
        return node;
    }
    export function updateJsxOpeningElement(node: ts.JsxOpeningElement, tagName: ts.JsxTagNameExpression, typeArguments: readonly ts.TypeNode[] | undefined, attributes: ts.JsxAttributes) {
        return node.tagName !== tagName
            || node.typeArguments !== typeArguments
            || node.attributes !== attributes
            ? updateNode(createJsxOpeningElement(tagName, typeArguments, attributes), node)
            : node;
    }
    export function createJsxClosingElement(tagName: ts.JsxTagNameExpression) {
        const node = (<ts.JsxClosingElement>createSynthesizedNode(ts.SyntaxKind.JsxClosingElement));
        node.tagName = tagName;
        return node;
    }
    export function updateJsxClosingElement(node: ts.JsxClosingElement, tagName: ts.JsxTagNameExpression) {
        return node.tagName !== tagName
            ? updateNode(createJsxClosingElement(tagName), node)
            : node;
    }
    export function createJsxFragment(openingFragment: ts.JsxOpeningFragment, children: readonly ts.JsxChild[], closingFragment: ts.JsxClosingFragment) {
        const node = (<ts.JsxFragment>createSynthesizedNode(ts.SyntaxKind.JsxFragment));
        node.openingFragment = openingFragment;
        node.children = createNodeArray(children);
        node.closingFragment = closingFragment;
        return node;
    }
    export function createJsxText(text: string, containsOnlyTriviaWhiteSpaces?: boolean) {
        const node = (<ts.JsxText>createSynthesizedNode(ts.SyntaxKind.JsxText));
        node.text = text;
        node.containsOnlyTriviaWhiteSpaces = !!containsOnlyTriviaWhiteSpaces;
        return node;
    }
    export function updateJsxText(node: ts.JsxText, text: string, containsOnlyTriviaWhiteSpaces?: boolean) {
        return node.text !== text
            || node.containsOnlyTriviaWhiteSpaces !== containsOnlyTriviaWhiteSpaces
            ? updateNode(createJsxText(text, containsOnlyTriviaWhiteSpaces), node)
            : node;
    }
    export function createJsxOpeningFragment() {
        return <ts.JsxOpeningFragment>createSynthesizedNode(ts.SyntaxKind.JsxOpeningFragment);
    }
    export function createJsxJsxClosingFragment() {
        return <ts.JsxClosingFragment>createSynthesizedNode(ts.SyntaxKind.JsxClosingFragment);
    }
    export function updateJsxFragment(node: ts.JsxFragment, openingFragment: ts.JsxOpeningFragment, children: readonly ts.JsxChild[], closingFragment: ts.JsxClosingFragment) {
        return node.openingFragment !== openingFragment
            || node.children !== children
            || node.closingFragment !== closingFragment
            ? updateNode(createJsxFragment(openingFragment, children, closingFragment), node)
            : node;
    }
    export function createJsxAttribute(name: ts.Identifier, initializer: ts.StringLiteral | ts.JsxExpression) {
        const node = (<ts.JsxAttribute>createSynthesizedNode(ts.SyntaxKind.JsxAttribute));
        node.name = name;
        node.initializer = initializer;
        return node;
    }
    export function updateJsxAttribute(node: ts.JsxAttribute, name: ts.Identifier, initializer: ts.StringLiteral | ts.JsxExpression) {
        return node.name !== name
            || node.initializer !== initializer
            ? updateNode(createJsxAttribute(name, initializer), node)
            : node;
    }
    export function createJsxAttributes(properties: readonly ts.JsxAttributeLike[]) {
        const node = (<ts.JsxAttributes>createSynthesizedNode(ts.SyntaxKind.JsxAttributes));
        node.properties = createNodeArray(properties);
        return node;
    }
    export function updateJsxAttributes(node: ts.JsxAttributes, properties: readonly ts.JsxAttributeLike[]) {
        return node.properties !== properties
            ? updateNode(createJsxAttributes(properties), node)
            : node;
    }
    export function createJsxSpreadAttribute(expression: ts.Expression) {
        const node = (<ts.JsxSpreadAttribute>createSynthesizedNode(ts.SyntaxKind.JsxSpreadAttribute));
        node.expression = expression;
        return node;
    }
    export function updateJsxSpreadAttribute(node: ts.JsxSpreadAttribute, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createJsxSpreadAttribute(expression), node)
            : node;
    }
    export function createJsxExpression(dotDotDotToken: ts.DotDotDotToken | undefined, expression: ts.Expression | undefined) {
        const node = (<ts.JsxExpression>createSynthesizedNode(ts.SyntaxKind.JsxExpression));
        node.dotDotDotToken = dotDotDotToken;
        node.expression = expression;
        return node;
    }
    export function updateJsxExpression(node: ts.JsxExpression, expression: ts.Expression | undefined) {
        return node.expression !== expression
            ? updateNode(createJsxExpression(node.dotDotDotToken, expression), node)
            : node;
    }
    // Clauses
    export function createCaseClause(expression: ts.Expression, statements: readonly ts.Statement[]) {
        const node = (<ts.CaseClause>createSynthesizedNode(ts.SyntaxKind.CaseClause));
        node.expression = ts.parenthesizeExpressionForList(expression);
        node.statements = createNodeArray(statements);
        return node;
    }
    export function updateCaseClause(node: ts.CaseClause, expression: ts.Expression, statements: readonly ts.Statement[]) {
        return node.expression !== expression
            || node.statements !== statements
            ? updateNode(createCaseClause(expression, statements), node)
            : node;
    }
    export function createDefaultClause(statements: readonly ts.Statement[]) {
        const node = (<ts.DefaultClause>createSynthesizedNode(ts.SyntaxKind.DefaultClause));
        node.statements = createNodeArray(statements);
        return node;
    }
    export function updateDefaultClause(node: ts.DefaultClause, statements: readonly ts.Statement[]) {
        return node.statements !== statements
            ? updateNode(createDefaultClause(statements), node)
            : node;
    }
    export function createHeritageClause(token: ts.HeritageClause["token"], types: readonly ts.ExpressionWithTypeArguments[]) {
        const node = (<ts.HeritageClause>createSynthesizedNode(ts.SyntaxKind.HeritageClause));
        node.token = token;
        node.types = createNodeArray(types);
        return node;
    }
    export function updateHeritageClause(node: ts.HeritageClause, types: readonly ts.ExpressionWithTypeArguments[]) {
        return node.types !== types
            ? updateNode(createHeritageClause(node.token, types), node)
            : node;
    }
    export function createCatchClause(variableDeclaration: string | ts.VariableDeclaration | undefined, block: ts.Block) {
        const node = (<ts.CatchClause>createSynthesizedNode(ts.SyntaxKind.CatchClause));
        node.variableDeclaration = ts.isString(variableDeclaration) ? createVariableDeclaration(variableDeclaration) : variableDeclaration;
        node.block = block;
        return node;
    }
    export function updateCatchClause(node: ts.CatchClause, variableDeclaration: ts.VariableDeclaration | undefined, block: ts.Block) {
        return node.variableDeclaration !== variableDeclaration
            || node.block !== block
            ? updateNode(createCatchClause(variableDeclaration, block), node)
            : node;
    }
    // Property assignments
    export function createPropertyAssignment(name: string | ts.PropertyName, initializer: ts.Expression) {
        const node = (<ts.PropertyAssignment>createSynthesizedNode(ts.SyntaxKind.PropertyAssignment));
        node.name = asName(name);
        node.questionToken = undefined;
        node.initializer = ts.parenthesizeExpressionForList(initializer);
        return node;
    }
    export function updatePropertyAssignment(node: ts.PropertyAssignment, name: ts.PropertyName, initializer: ts.Expression) {
        return node.name !== name
            || node.initializer !== initializer
            ? updateNode(createPropertyAssignment(name, initializer), node)
            : node;
    }
    export function createShorthandPropertyAssignment(name: string | ts.Identifier, objectAssignmentInitializer?: ts.Expression) {
        const node = (<ts.ShorthandPropertyAssignment>createSynthesizedNode(ts.SyntaxKind.ShorthandPropertyAssignment));
        node.name = asName(name);
        node.objectAssignmentInitializer = objectAssignmentInitializer !== undefined ? ts.parenthesizeExpressionForList(objectAssignmentInitializer) : undefined;
        return node;
    }
    export function updateShorthandPropertyAssignment(node: ts.ShorthandPropertyAssignment, name: ts.Identifier, objectAssignmentInitializer: ts.Expression | undefined) {
        return node.name !== name
            || node.objectAssignmentInitializer !== objectAssignmentInitializer
            ? updateNode(createShorthandPropertyAssignment(name, objectAssignmentInitializer), node)
            : node;
    }
    export function createSpreadAssignment(expression: ts.Expression) {
        const node = (<ts.SpreadAssignment>createSynthesizedNode(ts.SyntaxKind.SpreadAssignment));
        node.expression = ts.parenthesizeExpressionForList(expression);
        return node;
    }
    export function updateSpreadAssignment(node: ts.SpreadAssignment, expression: ts.Expression) {
        return node.expression !== expression
            ? updateNode(createSpreadAssignment(expression), node)
            : node;
    }
    // Enum
    export function createEnumMember(name: string | ts.PropertyName, initializer?: ts.Expression) {
        const node = (<ts.EnumMember>createSynthesizedNode(ts.SyntaxKind.EnumMember));
        node.name = asName(name);
        node.initializer = initializer && ts.parenthesizeExpressionForList(initializer);
        return node;
    }
    export function updateEnumMember(node: ts.EnumMember, name: ts.PropertyName, initializer: ts.Expression | undefined) {
        return node.name !== name
            || node.initializer !== initializer
            ? updateNode(createEnumMember(name, initializer), node)
            : node;
    }
    // Top-level nodes
    export function updateSourceFileNode(node: ts.SourceFile, statements: readonly ts.Statement[], isDeclarationFile?: boolean, referencedFiles?: ts.SourceFile["referencedFiles"], typeReferences?: ts.SourceFile["typeReferenceDirectives"], hasNoDefaultLib?: boolean, libReferences?: ts.SourceFile["libReferenceDirectives"]) {
        if (node.statements !== statements ||
            (isDeclarationFile !== undefined && node.isDeclarationFile !== isDeclarationFile) ||
            (referencedFiles !== undefined && node.referencedFiles !== referencedFiles) ||
            (typeReferences !== undefined && node.typeReferenceDirectives !== typeReferences) ||
            (libReferences !== undefined && node.libReferenceDirectives !== libReferences) ||
            (hasNoDefaultLib !== undefined && node.hasNoDefaultLib !== hasNoDefaultLib)) {
            const updated = (<ts.SourceFile>createSynthesizedNode(ts.SyntaxKind.SourceFile));
            updated.flags |= node.flags;
            updated.statements = createNodeArray(statements);
            updated.endOfFileToken = node.endOfFileToken;
            updated.fileName = node.fileName;
            updated.path = node.path;
            updated.text = node.text;
            updated.isDeclarationFile = isDeclarationFile === undefined ? node.isDeclarationFile : isDeclarationFile;
            updated.referencedFiles = referencedFiles === undefined ? node.referencedFiles : referencedFiles;
            updated.typeReferenceDirectives = typeReferences === undefined ? node.typeReferenceDirectives : typeReferences;
            updated.hasNoDefaultLib = hasNoDefaultLib === undefined ? node.hasNoDefaultLib : hasNoDefaultLib;
            updated.libReferenceDirectives = libReferences === undefined ? node.libReferenceDirectives : libReferences;
            if (node.amdDependencies !== undefined)
                updated.amdDependencies = node.amdDependencies;
            if (node.moduleName !== undefined)
                updated.moduleName = node.moduleName;
            if (node.languageVariant !== undefined)
                updated.languageVariant = node.languageVariant;
            if (node.renamedDependencies !== undefined)
                updated.renamedDependencies = node.renamedDependencies;
            if (node.languageVersion !== undefined)
                updated.languageVersion = node.languageVersion;
            if (node.scriptKind !== undefined)
                updated.scriptKind = node.scriptKind;
            if (node.externalModuleIndicator !== undefined)
                updated.externalModuleIndicator = node.externalModuleIndicator;
            if (node.commonJsModuleIndicator !== undefined)
                updated.commonJsModuleIndicator = node.commonJsModuleIndicator;
            if (node.identifiers !== undefined)
                updated.identifiers = node.identifiers;
            if (node.nodeCount !== undefined)
                updated.nodeCount = node.nodeCount;
            if (node.identifierCount !== undefined)
                updated.identifierCount = node.identifierCount;
            if (node.symbolCount !== undefined)
                updated.symbolCount = node.symbolCount;
            if (node.parseDiagnostics !== undefined)
                updated.parseDiagnostics = node.parseDiagnostics;
            if (node.bindDiagnostics !== undefined)
                updated.bindDiagnostics = node.bindDiagnostics;
            if (node.bindSuggestionDiagnostics !== undefined)
                updated.bindSuggestionDiagnostics = node.bindSuggestionDiagnostics;
            if (node.lineMap !== undefined)
                updated.lineMap = node.lineMap;
            if (node.classifiableNames !== undefined)
                updated.classifiableNames = node.classifiableNames;
            if (node.resolvedModules !== undefined)
                updated.resolvedModules = node.resolvedModules;
            if (node.resolvedTypeReferenceDirectiveNames !== undefined)
                updated.resolvedTypeReferenceDirectiveNames = node.resolvedTypeReferenceDirectiveNames;
            if (node.imports !== undefined)
                updated.imports = node.imports;
            if (node.moduleAugmentations !== undefined)
                updated.moduleAugmentations = node.moduleAugmentations;
            if (node.pragmas !== undefined)
                updated.pragmas = node.pragmas;
            if (node.localJsxFactory !== undefined)
                updated.localJsxFactory = node.localJsxFactory;
            if (node.localJsxNamespace !== undefined)
                updated.localJsxNamespace = node.localJsxNamespace;
            return updateNode(updated, node);
        }
        return node;
    }
    /**
     * Creates a shallow, memberwise clone of a node for mutation.
     */
    export function getMutableClone<T extends ts.Node>(node: T): T {
        const clone = getSynthesizedClone(node);
        clone.pos = node.pos;
        clone.end = node.end;
        clone.parent = node.parent;
        return clone;
    }
    // Transformation nodes
    /**
     * Creates a synthetic statement to act as a placeholder for a not-emitted statement in
     * order to preserve comments.
     *
     * @param original The original statement.
     */
    export function createNotEmittedStatement(original: ts.Node) {
        const node = (<ts.NotEmittedStatement>createSynthesizedNode(ts.SyntaxKind.NotEmittedStatement));
        node.original = original;
        setTextRange(node, original);
        return node;
    }
    /**
     * Creates a synthetic element to act as a placeholder for the end of an emitted declaration in
     * order to properly emit exports.
     */
    /* @internal */
    export function createEndOfDeclarationMarker(original: ts.Node) {
        const node = (<ts.EndOfDeclarationMarker>createSynthesizedNode(ts.SyntaxKind.EndOfDeclarationMarker));
        node.emitNode = ({} as ts.EmitNode);
        node.original = original;
        return node;
    }
    /**
     * Creates a synthetic element to act as a placeholder for the beginning of a merged declaration in
     * order to properly emit exports.
     */
    /* @internal */
    export function createMergeDeclarationMarker(original: ts.Node) {
        const node = (<ts.MergeDeclarationMarker>createSynthesizedNode(ts.SyntaxKind.MergeDeclarationMarker));
        node.emitNode = ({} as ts.EmitNode);
        node.original = original;
        return node;
    }
    /**
     * Creates a synthetic expression to act as a placeholder for a not-emitted expression in
     * order to preserve comments or sourcemap positions.
     *
     * @param expression The inner expression to emit.
     * @param original The original outer expression.
     * @param location The location for the expression. Defaults to the positions from "original" if provided.
     */
    export function createPartiallyEmittedExpression(expression: ts.Expression, original?: ts.Node) {
        const node = (<ts.PartiallyEmittedExpression>createSynthesizedNode(ts.SyntaxKind.PartiallyEmittedExpression));
        node.expression = expression;
        node.original = original;
        setTextRange(node, original);
        return node;
    }
    export function updatePartiallyEmittedExpression(node: ts.PartiallyEmittedExpression, expression: ts.Expression) {
        if (node.expression !== expression) {
            return updateNode(createPartiallyEmittedExpression(expression, node.original), node);
        }
        return node;
    }
    function flattenCommaElements(node: ts.Expression): ts.Expression | readonly ts.Expression[] {
        if (ts.nodeIsSynthesized(node) && !ts.isParseTreeNode(node) && !node.original && !node.emitNode && !node.id) {
            if (node.kind === ts.SyntaxKind.CommaListExpression) {
                return (<ts.CommaListExpression>node).elements;
            }
            if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.CommaToken) {
                return [node.left, node.right];
            }
        }
        return node;
    }
    export function createCommaList(elements: readonly ts.Expression[]) {
        const node = (<ts.CommaListExpression>createSynthesizedNode(ts.SyntaxKind.CommaListExpression));
        node.elements = createNodeArray(ts.sameFlatMap(elements, flattenCommaElements));
        return node;
    }
    export function updateCommaList(node: ts.CommaListExpression, elements: readonly ts.Expression[]) {
        return node.elements !== elements
            ? updateNode(createCommaList(elements), node)
            : node;
    }
    /* @internal */
    export function createSyntheticReferenceExpression(expression: ts.Expression, thisArg: ts.Expression) {
        const node = (<ts.SyntheticReferenceExpression>createSynthesizedNode(ts.SyntaxKind.SyntheticReferenceExpression));
        node.expression = expression;
        node.thisArg = thisArg;
        return node;
    }
    /* @internal */
    export function updateSyntheticReferenceExpression(node: ts.SyntheticReferenceExpression, expression: ts.Expression, thisArg: ts.Expression) {
        return node.expression !== expression
            || node.thisArg !== thisArg
            ? updateNode(createSyntheticReferenceExpression(expression, thisArg), node)
            : node;
    }
    export function createBundle(sourceFiles: readonly ts.SourceFile[], prepends: readonly (ts.UnparsedSource | ts.InputFiles)[] = ts.emptyArray) {
        const node = (<ts.Bundle>ts.createNode(ts.SyntaxKind.Bundle));
        node.prepends = prepends;
        node.sourceFiles = sourceFiles;
        return node;
    }
    let allUnscopedEmitHelpers: ts.ReadonlyMap<ts.UnscopedEmitHelper> | undefined;
    function getAllUnscopedEmitHelpers() {
        return allUnscopedEmitHelpers || (allUnscopedEmitHelpers = ts.arrayToMap([
            ts.valuesHelper,
            ts.readHelper,
            ts.spreadHelper,
            ts.spreadArraysHelper,
            ts.restHelper,
            ts.decorateHelper,
            ts.metadataHelper,
            ts.paramHelper,
            ts.awaiterHelper,
            ts.assignHelper,
            ts.awaitHelper,
            ts.asyncGeneratorHelper,
            ts.asyncDelegator,
            ts.asyncValues,
            ts.extendsHelper,
            ts.templateObjectHelper,
            ts.generatorHelper,
            ts.importStarHelper,
            ts.importDefaultHelper
        ], helper => helper.name));
    }
    function createUnparsedSource() {
        const node = (<ts.UnparsedSource>ts.createNode(ts.SyntaxKind.UnparsedSource));
        node.prologues = ts.emptyArray;
        node.referencedFiles = ts.emptyArray;
        node.libReferenceDirectives = ts.emptyArray;
        node.getLineAndCharacterOfPosition = pos => ts.getLineAndCharacterOfPosition(node, pos);
        return node;
    }
    export function createUnparsedSourceFile(text: string): ts.UnparsedSource;
    export function createUnparsedSourceFile(inputFile: ts.InputFiles, type: "js" | "dts", stripInternal?: boolean): ts.UnparsedSource;
    export function createUnparsedSourceFile(text: string, mapPath: string | undefined, map: string | undefined): ts.UnparsedSource;
    export function createUnparsedSourceFile(textOrInputFiles: string | ts.InputFiles, mapPathOrType?: string, mapTextOrStripInternal?: string | boolean): ts.UnparsedSource {
        const node = createUnparsedSource();
        let stripInternal: boolean | undefined;
        let bundleFileInfo: ts.BundleFileInfo | undefined;
        if (!ts.isString(textOrInputFiles)) {
            ts.Debug.assert(mapPathOrType === "js" || mapPathOrType === "dts");
            node.fileName = (mapPathOrType === "js" ? textOrInputFiles.javascriptPath : textOrInputFiles.declarationPath) || "";
            node.sourceMapPath = mapPathOrType === "js" ? textOrInputFiles.javascriptMapPath : textOrInputFiles.declarationMapPath;
            Object.defineProperties(node, {
                text: { get() { return mapPathOrType === "js" ? textOrInputFiles.javascriptText : textOrInputFiles.declarationText; } },
                sourceMapText: { get() { return mapPathOrType === "js" ? textOrInputFiles.javascriptMapText : textOrInputFiles.declarationMapText; } },
            });
            if (textOrInputFiles.buildInfo && textOrInputFiles.buildInfo.bundle) {
                node.oldFileOfCurrentEmit = textOrInputFiles.oldFileOfCurrentEmit;
                ts.Debug.assert(mapTextOrStripInternal === undefined || typeof mapTextOrStripInternal === "boolean");
                stripInternal = mapTextOrStripInternal as boolean | undefined;
                bundleFileInfo = mapPathOrType === "js" ? textOrInputFiles.buildInfo.bundle.js : textOrInputFiles.buildInfo.bundle.dts;
                if (node.oldFileOfCurrentEmit) {
                    parseOldFileOfCurrentEmit(node, ts.Debug.assertDefined(bundleFileInfo));
                    return node;
                }
            }
        }
        else {
            node.fileName = "";
            node.text = textOrInputFiles;
            node.sourceMapPath = mapPathOrType;
            node.sourceMapText = mapTextOrStripInternal as string;
        }
        ts.Debug.assert(!node.oldFileOfCurrentEmit);
        parseUnparsedSourceFile(node, bundleFileInfo, stripInternal);
        return node;
    }
    function parseUnparsedSourceFile(node: ts.UnparsedSource, bundleFileInfo: ts.BundleFileInfo | undefined, stripInternal: boolean | undefined) {
        let prologues: ts.UnparsedPrologue[] | undefined;
        let helpers: ts.UnscopedEmitHelper[] | undefined;
        let referencedFiles: ts.FileReference[] | undefined;
        let typeReferenceDirectives: string[] | undefined;
        let libReferenceDirectives: ts.FileReference[] | undefined;
        let texts: ts.UnparsedSourceText[] | undefined;
        for (const section of bundleFileInfo ? bundleFileInfo.sections : ts.emptyArray) {
            switch (section.kind) {
                case ts.BundleFileSectionKind.Prologue:
                    (prologues || (prologues = [])).push((createUnparsedNode(section, node) as ts.UnparsedPrologue));
                    break;
                case ts.BundleFileSectionKind.EmitHelpers:
                    (helpers || (helpers = [])).push(getAllUnscopedEmitHelpers().get(section.data)!);
                    break;
                case ts.BundleFileSectionKind.NoDefaultLib:
                    node.hasNoDefaultLib = true;
                    break;
                case ts.BundleFileSectionKind.Reference:
                    (referencedFiles || (referencedFiles = [])).push({ pos: -1, end: -1, fileName: section.data });
                    break;
                case ts.BundleFileSectionKind.Type:
                    (typeReferenceDirectives || (typeReferenceDirectives = [])).push(section.data);
                    break;
                case ts.BundleFileSectionKind.Lib:
                    (libReferenceDirectives || (libReferenceDirectives = [])).push({ pos: -1, end: -1, fileName: section.data });
                    break;
                case ts.BundleFileSectionKind.Prepend:
                    const prependNode = (createUnparsedNode(section, node) as ts.UnparsedPrepend);
                    let prependTexts: ts.UnparsedTextLike[] | undefined;
                    for (const text of section.texts) {
                        if (!stripInternal || text.kind !== ts.BundleFileSectionKind.Internal) {
                            (prependTexts || (prependTexts = [])).push((createUnparsedNode(text, node) as ts.UnparsedTextLike));
                        }
                    }
                    prependNode.texts = prependTexts || ts.emptyArray;
                    (texts || (texts = [])).push(prependNode);
                    break;
                case ts.BundleFileSectionKind.Internal:
                    if (stripInternal) {
                        if (!texts)
                            texts = [];
                        break;
                    }
                // falls through
                case ts.BundleFileSectionKind.Text:
                    (texts || (texts = [])).push((createUnparsedNode(section, node) as ts.UnparsedTextLike));
                    break;
                default:
                    ts.Debug.assertNever(section);
            }
        }
        node.prologues = prologues || ts.emptyArray;
        node.helpers = helpers;
        node.referencedFiles = referencedFiles || ts.emptyArray;
        node.typeReferenceDirectives = typeReferenceDirectives;
        node.libReferenceDirectives = libReferenceDirectives || ts.emptyArray;
        node.texts = texts || [(<ts.UnparsedTextLike>createUnparsedNode({ kind: ts.BundleFileSectionKind.Text, pos: 0, end: node.text.length }, node))];
    }
    function parseOldFileOfCurrentEmit(node: ts.UnparsedSource, bundleFileInfo: ts.BundleFileInfo) {
        ts.Debug.assert(!!node.oldFileOfCurrentEmit);
        let texts: ts.UnparsedTextLike[] | undefined;
        let syntheticReferences: ts.UnparsedSyntheticReference[] | undefined;
        for (const section of bundleFileInfo.sections) {
            switch (section.kind) {
                case ts.BundleFileSectionKind.Internal:
                case ts.BundleFileSectionKind.Text:
                    (texts || (texts = [])).push((createUnparsedNode(section, node) as ts.UnparsedTextLike));
                    break;
                case ts.BundleFileSectionKind.NoDefaultLib:
                case ts.BundleFileSectionKind.Reference:
                case ts.BundleFileSectionKind.Type:
                case ts.BundleFileSectionKind.Lib:
                    (syntheticReferences || (syntheticReferences = [])).push(createUnparsedSyntheticReference(section, node));
                    break;
                // Ignore
                case ts.BundleFileSectionKind.Prologue:
                case ts.BundleFileSectionKind.EmitHelpers:
                case ts.BundleFileSectionKind.Prepend:
                    break;
                default:
                    ts.Debug.assertNever(section);
            }
        }
        node.texts = texts || ts.emptyArray;
        node.helpers = ts.map(bundleFileInfo.sources && bundleFileInfo.sources.helpers, name => getAllUnscopedEmitHelpers().get(name)!);
        node.syntheticReferences = syntheticReferences;
        return node;
    }
    function mapBundleFileSectionKindToSyntaxKind(kind: ts.BundleFileSectionKind): ts.SyntaxKind {
        switch (kind) {
            case ts.BundleFileSectionKind.Prologue: return ts.SyntaxKind.UnparsedPrologue;
            case ts.BundleFileSectionKind.Prepend: return ts.SyntaxKind.UnparsedPrepend;
            case ts.BundleFileSectionKind.Internal: return ts.SyntaxKind.UnparsedInternalText;
            case ts.BundleFileSectionKind.Text: return ts.SyntaxKind.UnparsedText;
            case ts.BundleFileSectionKind.EmitHelpers:
            case ts.BundleFileSectionKind.NoDefaultLib:
            case ts.BundleFileSectionKind.Reference:
            case ts.BundleFileSectionKind.Type:
            case ts.BundleFileSectionKind.Lib:
                return ts.Debug.fail(`BundleFileSectionKind: ${kind} not yet mapped to SyntaxKind`);
            default:
                return ts.Debug.assertNever(kind);
        }
    }
    function createUnparsedNode(section: ts.BundleFileSection, parent: ts.UnparsedSource): ts.UnparsedNode {
        const node = (ts.createNode(mapBundleFileSectionKindToSyntaxKind(section.kind), section.pos, section.end) as ts.UnparsedNode);
        node.parent = parent;
        node.data = section.data;
        return node;
    }
    function createUnparsedSyntheticReference(section: ts.BundleFileHasNoDefaultLib | ts.BundleFileReference, parent: ts.UnparsedSource) {
        const node = (ts.createNode(ts.SyntaxKind.UnparsedSyntheticReference, section.pos, section.end) as ts.UnparsedSyntheticReference);
        node.parent = parent;
        node.data = section.data;
        node.section = section;
        return node;
    }
    export function createInputFiles(javascriptText: string, declarationText: string): ts.InputFiles;
    export function createInputFiles(readFileText: (path: string) => string | undefined, javascriptPath: string, javascriptMapPath: string | undefined, declarationPath: string, declarationMapPath: string | undefined, buildInfoPath: string | undefined): ts.InputFiles;
    export function createInputFiles(javascriptText: string, declarationText: string, javascriptMapPath: string | undefined, javascriptMapText: string | undefined, declarationMapPath: string | undefined, declarationMapText: string | undefined): ts.InputFiles;
    /*@internal*/
    export function createInputFiles(javascriptText: string, declarationText: string, javascriptMapPath: string | undefined, javascriptMapText: string | undefined, declarationMapPath: string | undefined, declarationMapText: string | undefined, javascriptPath: string | undefined, declarationPath: string | undefined, buildInfoPath?: string | undefined, buildInfo?: ts.BuildInfo, oldFileOfCurrentEmit?: boolean): ts.InputFiles;
    export function createInputFiles(javascriptTextOrReadFileText: string | ((path: string) => string | undefined), declarationTextOrJavascriptPath: string, javascriptMapPath?: string, javascriptMapTextOrDeclarationPath?: string, declarationMapPath?: string, declarationMapTextOrBuildInfoPath?: string, javascriptPath?: string | undefined, declarationPath?: string | undefined, buildInfoPath?: string | undefined, buildInfo?: ts.BuildInfo, oldFileOfCurrentEmit?: boolean): ts.InputFiles {
        const node = (<ts.InputFiles>ts.createNode(ts.SyntaxKind.InputFiles));
        if (!ts.isString(javascriptTextOrReadFileText)) {
            const cache = ts.createMap<string | false>();
            const textGetter = (path: string | undefined) => {
                if (path === undefined)
                    return undefined;
                let value = cache.get(path);
                if (value === undefined) {
                    value = javascriptTextOrReadFileText(path);
                    cache.set(path, value !== undefined ? value : false);
                }
                return value !== false ? value as string : undefined;
            };
            const definedTextGetter = (path: string) => {
                const result = textGetter(path);
                return result !== undefined ? result : `/* Input file ${path} was missing */\r\n`;
            };
            let buildInfo: ts.BuildInfo | false;
            const getAndCacheBuildInfo = (getText: () => string | undefined) => {
                if (buildInfo === undefined) {
                    const result = getText();
                    buildInfo = result !== undefined ? ts.getBuildInfo(result) : false;
                }
                return buildInfo || undefined;
            };
            node.javascriptPath = declarationTextOrJavascriptPath;
            node.javascriptMapPath = javascriptMapPath;
            node.declarationPath = ts.Debug.assertDefined(javascriptMapTextOrDeclarationPath);
            node.declarationMapPath = declarationMapPath;
            node.buildInfoPath = declarationMapTextOrBuildInfoPath;
            Object.defineProperties(node, {
                javascriptText: { get() { return definedTextGetter(declarationTextOrJavascriptPath); } },
                javascriptMapText: { get() { return textGetter(javascriptMapPath); } },
                declarationText: { get() { return definedTextGetter(ts.Debug.assertDefined(javascriptMapTextOrDeclarationPath)); } },
                declarationMapText: { get() { return textGetter(declarationMapPath); } },
                buildInfo: { get() { return getAndCacheBuildInfo(() => textGetter(declarationMapTextOrBuildInfoPath)); } }
            });
        }
        else {
            node.javascriptText = javascriptTextOrReadFileText;
            node.javascriptMapPath = javascriptMapPath;
            node.javascriptMapText = javascriptMapTextOrDeclarationPath;
            node.declarationText = declarationTextOrJavascriptPath;
            node.declarationMapPath = declarationMapPath;
            node.declarationMapText = declarationMapTextOrBuildInfoPath;
            node.javascriptPath = javascriptPath;
            node.declarationPath = declarationPath;
            node.buildInfoPath = buildInfoPath;
            node.buildInfo = buildInfo;
            node.oldFileOfCurrentEmit = oldFileOfCurrentEmit;
        }
        return node;
    }
    export function updateBundle(node: ts.Bundle, sourceFiles: readonly ts.SourceFile[], prepends: readonly (ts.UnparsedSource | ts.InputFiles)[] = ts.emptyArray) {
        if (node.sourceFiles !== sourceFiles || node.prepends !== prepends) {
            return createBundle(sourceFiles, prepends);
        }
        return node;
    }
    // Compound nodes
    export function createImmediatelyInvokedFunctionExpression(statements: readonly ts.Statement[]): ts.CallExpression;
    export function createImmediatelyInvokedFunctionExpression(statements: readonly ts.Statement[], param: ts.ParameterDeclaration, paramValue: ts.Expression): ts.CallExpression;
    export function createImmediatelyInvokedFunctionExpression(statements: readonly ts.Statement[], param?: ts.ParameterDeclaration, paramValue?: ts.Expression) {
        return createCall(createFunctionExpression(
        /*modifiers*/ undefined, 
        /*asteriskToken*/ undefined, 
        /*name*/ undefined, 
        /*typeParameters*/ undefined, 
        /*parameters*/ param ? [param] : [], 
        /*type*/ undefined, createBlock(statements, /*multiLine*/ true)), 
        /*typeArguments*/ undefined, 
        /*argumentsArray*/ paramValue ? [paramValue] : []);
    }
    export function createImmediatelyInvokedArrowFunction(statements: readonly ts.Statement[]): ts.CallExpression;
    export function createImmediatelyInvokedArrowFunction(statements: readonly ts.Statement[], param: ts.ParameterDeclaration, paramValue: ts.Expression): ts.CallExpression;
    export function createImmediatelyInvokedArrowFunction(statements: readonly ts.Statement[], param?: ts.ParameterDeclaration, paramValue?: ts.Expression) {
        return createCall(createArrowFunction(
        /*modifiers*/ undefined, 
        /*typeParameters*/ undefined, 
        /*parameters*/ param ? [param] : [], 
        /*type*/ undefined, 
        /*equalsGreaterThanToken*/ undefined, createBlock(statements, /*multiLine*/ true)), 
        /*typeArguments*/ undefined, 
        /*argumentsArray*/ paramValue ? [paramValue] : []);
    }
    export function createComma(left: ts.Expression, right: ts.Expression) {
        return <ts.Expression>createBinary(left, ts.SyntaxKind.CommaToken, right);
    }
    export function createLessThan(left: ts.Expression, right: ts.Expression) {
        return <ts.Expression>createBinary(left, ts.SyntaxKind.LessThanToken, right);
    }
    export function createAssignment(left: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression, right: ts.Expression): ts.DestructuringAssignment;
    export function createAssignment(left: ts.Expression, right: ts.Expression): ts.BinaryExpression;
    export function createAssignment(left: ts.Expression, right: ts.Expression) {
        return createBinary(left, ts.SyntaxKind.EqualsToken, right);
    }
    export function createStrictEquality(left: ts.Expression, right: ts.Expression) {
        return createBinary(left, ts.SyntaxKind.EqualsEqualsEqualsToken, right);
    }
    export function createStrictInequality(left: ts.Expression, right: ts.Expression) {
        return createBinary(left, ts.SyntaxKind.ExclamationEqualsEqualsToken, right);
    }
    export function createAdd(left: ts.Expression, right: ts.Expression) {
        return createBinary(left, ts.SyntaxKind.PlusToken, right);
    }
    export function createSubtract(left: ts.Expression, right: ts.Expression) {
        return createBinary(left, ts.SyntaxKind.MinusToken, right);
    }
    export function createPostfixIncrement(operand: ts.Expression) {
        return createPostfix(operand, ts.SyntaxKind.PlusPlusToken);
    }
    export function createLogicalAnd(left: ts.Expression, right: ts.Expression) {
        return createBinary(left, ts.SyntaxKind.AmpersandAmpersandToken, right);
    }
    export function createLogicalOr(left: ts.Expression, right: ts.Expression) {
        return createBinary(left, ts.SyntaxKind.BarBarToken, right);
    }
    export function createNullishCoalesce(left: ts.Expression, right: ts.Expression) {
        return createBinary(left, ts.SyntaxKind.QuestionQuestionToken, right);
    }
    export function createLogicalNot(operand: ts.Expression) {
        return createPrefix(ts.SyntaxKind.ExclamationToken, operand);
    }
    export function createVoidZero() {
        return createVoid(createLiteral(0));
    }
    export function createExportDefault(expression: ts.Expression) {
        return createExportAssignment(/*decorators*/ undefined, /*modifiers*/ undefined, /*isExportEquals*/ false, expression);
    }
    export function createExternalModuleExport(exportName: ts.Identifier) {
        return createExportDeclaration(/*decorators*/ undefined, /*modifiers*/ undefined, createNamedExports([createExportSpecifier(/*propertyName*/ undefined, exportName)]));
    }
    // Utilities
    function asName<T extends ts.Identifier | ts.BindingName | ts.PropertyName | ts.EntityName | ts.ThisTypeNode | undefined>(name: string | T): T | ts.Identifier {
        return ts.isString(name) ? createIdentifier(name) : name;
    }
    function asExpression<T extends ts.Expression | undefined>(value: string | number | boolean | T): T | ts.StringLiteral | ts.NumericLiteral | ts.BooleanLiteral {
        return typeof value === "string" ? createStringLiteral(value) :
            typeof value === "number" ? createNumericLiteral("" + value) :
                typeof value === "boolean" ? value ? createTrue() : createFalse() :
                    value;
    }
    function asNodeArray<T extends ts.Node>(array: readonly T[]): ts.NodeArray<T>;
    function asNodeArray<T extends ts.Node>(array: readonly T[] | undefined): ts.NodeArray<T> | undefined;
    function asNodeArray<T extends ts.Node>(array: readonly T[] | undefined): ts.NodeArray<T> | undefined {
        return array ? createNodeArray(array) : undefined;
    }
    function asToken<TKind extends ts.SyntaxKind>(value: TKind | ts.Token<TKind>): ts.Token<TKind> {
        return typeof value === "number" ? createToken(value) : value;
    }
    function asEmbeddedStatement<T extends ts.Node>(statement: T): T | ts.EmptyStatement;
    function asEmbeddedStatement<T extends ts.Node>(statement: T | undefined): T | ts.EmptyStatement | undefined;
    function asEmbeddedStatement<T extends ts.Node>(statement: T | undefined): T | ts.EmptyStatement | undefined {
        return statement && ts.isNotEmittedStatement(statement) ? setTextRange(setOriginalNode(createEmptyStatement(), statement), statement) : statement;
    }
    /**
     * Clears any EmitNode entries from parse-tree nodes.
     * @param sourceFile A source file.
     */
    export function disposeEmitNodes(sourceFile: ts.SourceFile) {
        // During transformation we may need to annotate a parse tree node with transient
        // transformation properties. As parse tree nodes live longer than transformation
        // nodes, we need to make sure we reclaim any memory allocated for custom ranges
        // from these nodes to ensure we do not hold onto entire subtrees just for position
        // information. We also need to reset these nodes to a pre-transformation state
        // for incremental parsing scenarios so that we do not impact later emit.
        sourceFile = ts.getSourceFileOfNode(ts.getParseTreeNode(sourceFile));
        const emitNode = sourceFile && sourceFile.emitNode;
        const annotatedNodes = emitNode && emitNode.annotatedNodes;
        if (annotatedNodes) {
            for (const node of annotatedNodes) {
                node.emitNode = undefined;
            }
        }
    }
    /**
     * Associates a node with the current transformation, initializing
     * various transient transformation properties.
     */
    /* @internal */
    export function getOrCreateEmitNode(node: ts.Node): ts.EmitNode {
        if (!node.emitNode) {
            if (ts.isParseTreeNode(node)) {
                // To avoid holding onto transformation artifacts, we keep track of any
                // parse tree node we are annotating. This allows us to clean them up after
                // all transformations have completed.
                if (node.kind === ts.SyntaxKind.SourceFile) {
                    return node.emitNode = ({ annotatedNodes: [node] } as ts.EmitNode);
                }
                const sourceFile = ts.getSourceFileOfNode(ts.getParseTreeNode(ts.getSourceFileOfNode(node)));
                getOrCreateEmitNode(sourceFile).annotatedNodes!.push(node);
            }
            node.emitNode = ({} as ts.EmitNode);
        }
        return node.emitNode;
    }
    /**
     * Sets `EmitFlags.NoComments` on a node and removes any leading and trailing synthetic comments.
     * @internal
     */
    export function removeAllComments<T extends ts.Node>(node: T): T {
        const emitNode = getOrCreateEmitNode(node);
        emitNode.flags |= ts.EmitFlags.NoComments;
        emitNode.leadingComments = undefined;
        emitNode.trailingComments = undefined;
        return node;
    }
    export function setTextRange<T extends ts.TextRange>(range: T, location: ts.TextRange | undefined): T {
        if (location) {
            range.pos = location.pos;
            range.end = location.end;
        }
        return range;
    }
    /**
     * Sets flags that control emit behavior of a node.
     */
    export function setEmitFlags<T extends ts.Node>(node: T, emitFlags: ts.EmitFlags) {
        getOrCreateEmitNode(node).flags = emitFlags;
        return node;
    }
    /**
     * Sets flags that control emit behavior of a node.
     */
    /* @internal */
    export function addEmitFlags<T extends ts.Node>(node: T, emitFlags: ts.EmitFlags) {
        const emitNode = getOrCreateEmitNode(node);
        emitNode.flags = emitNode.flags | emitFlags;
        return node;
    }
    /**
     * Gets a custom text range to use when emitting source maps.
     */
    export function getSourceMapRange(node: ts.Node): ts.SourceMapRange {
        const emitNode = node.emitNode;
        return (emitNode && emitNode.sourceMapRange) || node;
    }
    /**
     * Sets a custom text range to use when emitting source maps.
     */
    export function setSourceMapRange<T extends ts.Node>(node: T, range: ts.SourceMapRange | undefined) {
        getOrCreateEmitNode(node).sourceMapRange = range;
        return node;
    }
    let SourceMapSource: new (fileName: string, text: string, skipTrivia?: (pos: number) => number) => ts.SourceMapSource;
    /**
     * Create an external source map source file reference
     */
    export function createSourceMapSource(fileName: string, text: string, skipTrivia?: (pos: number) => number): ts.SourceMapSource {
        return new (SourceMapSource || (SourceMapSource = ts.objectAllocator.getSourceMapSourceConstructor()))(fileName, text, skipTrivia);
    }
    /**
     * Gets the TextRange to use for source maps for a token of a node.
     */
    export function getTokenSourceMapRange(node: ts.Node, token: ts.SyntaxKind): ts.SourceMapRange | undefined {
        const emitNode = node.emitNode;
        const tokenSourceMapRanges = emitNode && emitNode.tokenSourceMapRanges;
        return tokenSourceMapRanges && tokenSourceMapRanges[token];
    }
    /**
     * Sets the TextRange to use for source maps for a token of a node.
     */
    export function setTokenSourceMapRange<T extends ts.Node>(node: T, token: ts.SyntaxKind, range: ts.SourceMapRange | undefined) {
        const emitNode = getOrCreateEmitNode(node);
        const tokenSourceMapRanges = emitNode.tokenSourceMapRanges || (emitNode.tokenSourceMapRanges = []);
        tokenSourceMapRanges[token] = range;
        return node;
    }
    /**
     * Gets a custom text range to use when emitting comments.
     */
    /*@internal*/
    export function getStartsOnNewLine(node: ts.Node) {
        const emitNode = node.emitNode;
        return emitNode && emitNode.startsOnNewLine;
    }
    /**
     * Sets a custom text range to use when emitting comments.
     */
    /*@internal*/
    export function setStartsOnNewLine<T extends ts.Node>(node: T, newLine: boolean) {
        getOrCreateEmitNode(node).startsOnNewLine = newLine;
        return node;
    }
    /**
     * Gets a custom text range to use when emitting comments.
     */
    export function getCommentRange(node: ts.Node) {
        const emitNode = node.emitNode;
        return (emitNode && emitNode.commentRange) || node;
    }
    /**
     * Sets a custom text range to use when emitting comments.
     */
    export function setCommentRange<T extends ts.Node>(node: T, range: ts.TextRange) {
        getOrCreateEmitNode(node).commentRange = range;
        return node;
    }
    export function getSyntheticLeadingComments(node: ts.Node): ts.SynthesizedComment[] | undefined {
        const emitNode = node.emitNode;
        return emitNode && emitNode.leadingComments;
    }
    export function setSyntheticLeadingComments<T extends ts.Node>(node: T, comments: ts.SynthesizedComment[] | undefined) {
        getOrCreateEmitNode(node).leadingComments = comments;
        return node;
    }
    export function addSyntheticLeadingComment<T extends ts.Node>(node: T, kind: ts.SyntaxKind.SingleLineCommentTrivia | ts.SyntaxKind.MultiLineCommentTrivia, text: string, hasTrailingNewLine?: boolean) {
        return setSyntheticLeadingComments(node, ts.append<ts.SynthesizedComment>(getSyntheticLeadingComments(node), { kind, pos: -1, end: -1, hasTrailingNewLine, text }));
    }
    export function getSyntheticTrailingComments(node: ts.Node): ts.SynthesizedComment[] | undefined {
        const emitNode = node.emitNode;
        return emitNode && emitNode.trailingComments;
    }
    export function setSyntheticTrailingComments<T extends ts.Node>(node: T, comments: ts.SynthesizedComment[] | undefined) {
        getOrCreateEmitNode(node).trailingComments = comments;
        return node;
    }
    export function addSyntheticTrailingComment<T extends ts.Node>(node: T, kind: ts.SyntaxKind.SingleLineCommentTrivia | ts.SyntaxKind.MultiLineCommentTrivia, text: string, hasTrailingNewLine?: boolean) {
        return setSyntheticTrailingComments(node, ts.append<ts.SynthesizedComment>(getSyntheticTrailingComments(node), { kind, pos: -1, end: -1, hasTrailingNewLine, text }));
    }
    export function moveSyntheticComments<T extends ts.Node>(node: T, original: ts.Node): T {
        setSyntheticLeadingComments(node, getSyntheticLeadingComments(original));
        setSyntheticTrailingComments(node, getSyntheticTrailingComments(original));
        const emit = getOrCreateEmitNode(original);
        emit.leadingComments = undefined;
        emit.trailingComments = undefined;
        return node;
    }
    /**
     * Gets the constant value to emit for an expression.
     */
    export function getConstantValue(node: ts.PropertyAccessExpression | ts.ElementAccessExpression): string | number | undefined {
        const emitNode = node.emitNode;
        return emitNode && emitNode.constantValue;
    }
    /**
     * Sets the constant value to emit for an expression.
     */
    export function setConstantValue(node: ts.PropertyAccessExpression | ts.ElementAccessExpression, value: string | number): ts.PropertyAccessExpression | ts.ElementAccessExpression {
        const emitNode = getOrCreateEmitNode(node);
        emitNode.constantValue = value;
        return node;
    }
    /**
     * Adds an EmitHelper to a node.
     */
    export function addEmitHelper<T extends ts.Node>(node: T, helper: ts.EmitHelper): T {
        const emitNode = getOrCreateEmitNode(node);
        emitNode.helpers = ts.append(emitNode.helpers, helper);
        return node;
    }
    /**
     * Add EmitHelpers to a node.
     */
    export function addEmitHelpers<T extends ts.Node>(node: T, helpers: ts.EmitHelper[] | undefined): T {
        if (ts.some(helpers)) {
            const emitNode = getOrCreateEmitNode(node);
            for (const helper of helpers) {
                emitNode.helpers = ts.appendIfUnique(emitNode.helpers, helper);
            }
        }
        return node;
    }
    /**
     * Removes an EmitHelper from a node.
     */
    export function removeEmitHelper(node: ts.Node, helper: ts.EmitHelper): boolean {
        const emitNode = node.emitNode;
        if (emitNode) {
            const helpers = emitNode.helpers;
            if (helpers) {
                return ts.orderedRemoveItem(helpers, helper);
            }
        }
        return false;
    }
    /**
     * Gets the EmitHelpers of a node.
     */
    export function getEmitHelpers(node: ts.Node): ts.EmitHelper[] | undefined {
        const emitNode = node.emitNode;
        return emitNode && emitNode.helpers;
    }
    /**
     * Moves matching emit helpers from a source node to a target node.
     */
    export function moveEmitHelpers(source: ts.Node, target: ts.Node, predicate: (helper: ts.EmitHelper) => boolean) {
        const sourceEmitNode = source.emitNode;
        const sourceEmitHelpers = sourceEmitNode && sourceEmitNode.helpers;
        if (!ts.some(sourceEmitHelpers))
            return;
        const targetEmitNode = getOrCreateEmitNode(target);
        let helpersRemoved = 0;
        for (let i = 0; i < sourceEmitHelpers.length; i++) {
            const helper = sourceEmitHelpers[i];
            if (predicate(helper)) {
                helpersRemoved++;
                targetEmitNode.helpers = ts.appendIfUnique(targetEmitNode.helpers, helper);
            }
            else if (helpersRemoved > 0) {
                sourceEmitHelpers[i - helpersRemoved] = helper;
            }
        }
        if (helpersRemoved > 0) {
            sourceEmitHelpers.length -= helpersRemoved;
        }
    }
    /* @internal */
    export function compareEmitHelpers(x: ts.EmitHelper, y: ts.EmitHelper) {
        if (x === y)
            return ts.Comparison.EqualTo;
        if (x.priority === y.priority)
            return ts.Comparison.EqualTo;
        if (x.priority === undefined)
            return ts.Comparison.GreaterThan;
        if (y.priority === undefined)
            return ts.Comparison.LessThan;
        return ts.compareValues(x.priority, y.priority);
    }
    export function setOriginalNode<T extends ts.Node>(node: T, original: ts.Node | undefined): T {
        node.original = original;
        if (original) {
            const emitNode = original.emitNode;
            if (emitNode)
                node.emitNode = mergeEmitNode(emitNode, node.emitNode);
        }
        return node;
    }
    function mergeEmitNode(sourceEmitNode: ts.EmitNode, destEmitNode: ts.EmitNode | undefined) {
        const { flags, leadingComments, trailingComments, commentRange, sourceMapRange, tokenSourceMapRanges, constantValue, helpers, startsOnNewLine, } = sourceEmitNode;
        if (!destEmitNode)
            destEmitNode = ({} as ts.EmitNode);
        // We are using `.slice()` here in case `destEmitNode.leadingComments` is pushed to later.
        if (leadingComments)
            destEmitNode.leadingComments = ts.addRange(leadingComments.slice(), destEmitNode.leadingComments);
        if (trailingComments)
            destEmitNode.trailingComments = ts.addRange(trailingComments.slice(), destEmitNode.trailingComments);
        if (flags)
            destEmitNode.flags = flags;
        if (commentRange)
            destEmitNode.commentRange = commentRange;
        if (sourceMapRange)
            destEmitNode.sourceMapRange = sourceMapRange;
        if (tokenSourceMapRanges)
            destEmitNode.tokenSourceMapRanges = mergeTokenSourceMapRanges(tokenSourceMapRanges, destEmitNode.tokenSourceMapRanges!);
        if (constantValue !== undefined)
            destEmitNode.constantValue = constantValue;
        if (helpers)
            destEmitNode.helpers = ts.addRange(destEmitNode.helpers, helpers);
        if (startsOnNewLine !== undefined)
            destEmitNode.startsOnNewLine = startsOnNewLine;
        return destEmitNode;
    }
    function mergeTokenSourceMapRanges(sourceRanges: (ts.TextRange | undefined)[], destRanges: (ts.TextRange | undefined)[]) {
        if (!destRanges)
            destRanges = [];
        for (const key in sourceRanges) {
            destRanges[key] = sourceRanges[key];
        }
        return destRanges;
    }
}

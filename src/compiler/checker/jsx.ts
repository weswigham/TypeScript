/** @internal */
namespace ts {
    export function createJsxCheckerFunctions(
        compilerOptions: CompilerOptions,
        emptyArray: any[],
        error: (location: Node, message: DiagnosticMessage, arg0?: any, arg1?: any, arg2?: any) => void,
        grammarErrorOnNode: (node: Node, message: DiagnosticMessage, arg0?: any, arg1?: any, arg2?: any) => boolean,
        checkExpression: (node: Expression) => Type,
        getPropertyOfType: (type: Type, propname: string) => Symbol,
        getTypeOfSymbol: (symbol: Symbol) => Type,
        getIndexTypeOfType: (type: Type, index: IndexKind) => Type,
        typeToString: (type: Type) => string,
        checkTypeAssignableTo: (source: Type, target: Type, errorNode: Node, headMessage?: DiagnosticMessage, containingMessageChain?: DiagnosticMessageChain) => boolean,
        isTypeAssignableTo: (source: Type, target: Type) => boolean,
        getPropertiesOfType: (type: Type) => Symbol[],
        getNodeLinks: (node: Node) => NodeLinks,
        getExportedTypeFromNamespace: (namespace: string, name: string) => Type,
        getUnionType: (types: Type[], subtypeReduction?: boolean) => Type,
        getSignaturesOfType: (type: Type, kind: SignatureKind) => Signature[],
        getReturnTypeOfSignature: (sig: Signature) => Type,
        getGlobalSymbol: (name: string, meaning: SymbolFlags, diagnostic: DiagnosticMessage) => Symbol,
        getSymbol: (symbols: SymbolTable, name: string, meaning: SymbolFlags) => Symbol,
        getDeclaredTypeOfSymbol: (sym: Symbol) => Type,
        intersectTypes: (type1: Type, type2: Type) => Type,
        getTypeOfPropertyOfType: (type: Type, name: string) => Type,
        getLocalTypeParametersOfClassOrInterfaceOrTypeAlias: (symbol: Symbol) => TypeParameter[],
        createTypeReference: (target: GenericType, typeArguments: Type[]) => TypeReference,
        getIndexInfoOfSymbol: (symbol: Symbol, kind: IndexKind) => IndexInfo,
        getSymbolLinks: (symbol: Symbol) => SymbolLinks,
        resolveName: (location: Node | undefined, name: string, meaning: SymbolFlags, nameNotFoundMessage: DiagnosticMessage, nameArg: string | Identifier) => Symbol,
        ) {

        /** Things we lazy load from the JSX namespace */
        const jsxTypes = createMap<ObjectType>();
        const JsxNames = {
            JSX: "JSX",
            IntrinsicElements: "IntrinsicElements",
            ElementClass: "ElementClass",
            ElementAttributesPropertyNameContainer: "ElementAttributesProperty",
            Element: "Element",
            IntrinsicAttributes: "IntrinsicAttributes",
            IntrinsicClassAttributes: "IntrinsicClassAttributes"
        };
        let jsxElementType: ObjectType;
        let jsxElementClassType: Type;
        let anyType: IntrinsicType;
        let emptyObjectType: Type;
        let unknownType: IntrinsicType;
        let booleanType: IntrinsicType & UnionType;
        let unknownSymbol: Symbol;

        return {
            checkJsxElement,
            checkJsxExpression,
            checkJsxSelfClosingElement,
            getJsxElementAttributesType,
            isJsxIntrinsicIdentifier,
            getIntrinsicTagSymbol,
            getJsxAttributePropertySymbol,
            getJsxIntrinsicTagNames,
            onInitializeTypeChecker
        };

        function onInitializeTypeChecker(any: IntrinsicType, empty: Type, unknown: IntrinsicType, boolean: IntrinsicType & UnionType, unknownSym: Symbol) {
            anyType = any;
            emptyObjectType = empty;
            unknownType = unknown;
            booleanType = boolean;
            unknownSymbol = unknownSym;

            jsxElementType = getExportedTypeFromNamespace("JSX", JsxNames.Element);
        }

        function checkJsxSelfClosingElement(node: JsxSelfClosingElement) {
            checkJsxOpeningLikeElement(node);
            return jsxElementType || anyType;
        }

        function checkJsxElement(node: JsxElement) {
            // Check attributes
            checkJsxOpeningLikeElement(node.openingElement);

            // Perform resolution on the closing tag so that rename/go to definition/etc work
            if (isJsxIntrinsicIdentifier(node.closingElement.tagName)) {
                getIntrinsicTagSymbol(node.closingElement);
            }
            else {
                checkExpression(node.closingElement.tagName);
            }

            // Check children
            for (const child of node.children) {
                switch (child.kind) {
                    case SyntaxKind.JsxExpression:
                        checkJsxExpression(<JsxExpression>child);
                        break;
                    case SyntaxKind.JsxElement:
                        checkJsxElement(<JsxElement>child);
                        break;
                    case SyntaxKind.JsxSelfClosingElement:
                        checkJsxSelfClosingElement(<JsxSelfClosingElement>child);
                        break;
                }
            }

            return jsxElementType || anyType;
        }

        /**
         * Returns true iff the JSX element name would be a valid JS identifier, ignoring restrictions about keywords not being identifiers
         */
        function isUnhyphenatedJsxName(name: string) {
            // - is the only character supported in JSX attribute names that isn't valid in JavaScript identifiers
            return name.indexOf("-") < 0;
        }

        /**
         * Returns true iff React would emit this tag name as a string rather than an identifier or qualified name
         */
        function isJsxIntrinsicIdentifier(tagName: JsxTagNameExpression) {
            // TODO (yuisu): comment
            if (tagName.kind === SyntaxKind.PropertyAccessExpression || tagName.kind === SyntaxKind.ThisKeyword) {
                return false;
            }
            else {
                return isIntrinsicJsxName((<Identifier>tagName).text);
            }
        }

        function checkJsxAttribute(node: JsxAttribute, elementAttributesType: Type, nameTable: Map<boolean>) {
            let correspondingPropType: Type = undefined;

            // Look up the corresponding property for this attribute
            if (elementAttributesType === emptyObjectType && isUnhyphenatedJsxName(node.name.text)) {
                // If there is no 'props' property, you may not have non-"data-" attributes
                error(node.parent, Diagnostics.JSX_element_class_does_not_support_attributes_because_it_does_not_have_a_0_property, getJsxElementPropertiesName());
            }
            else if (elementAttributesType && !isTypeAny(elementAttributesType)) {
                const correspondingPropSymbol = getPropertyOfType(elementAttributesType, node.name.text);
                correspondingPropType = correspondingPropSymbol && getTypeOfSymbol(correspondingPropSymbol);
                if (isUnhyphenatedJsxName(node.name.text)) {
                    // Maybe there's a string indexer?
                    const indexerType = getIndexTypeOfType(elementAttributesType, IndexKind.String);
                    if (indexerType) {
                        correspondingPropType = indexerType;
                    }
                    else {
                        // If there's no corresponding property with this name, error
                        if (!correspondingPropType) {
                            error(node.name, Diagnostics.Property_0_does_not_exist_on_type_1, node.name.text, typeToString(elementAttributesType));
                            return unknownType;
                        }
                    }
                }
            }

            let exprType: Type;
            if (node.initializer) {
                exprType = checkExpression(node.initializer);
            }
            else {
                // <Elem attr /> is sugar for <Elem attr={true} />
                exprType = booleanType;
            }

            if (correspondingPropType) {
                checkTypeAssignableTo(exprType, correspondingPropType, node);
            }

            nameTable[node.name.text] = true;
            return exprType;
        }

        function checkJsxSpreadAttribute(node: JsxSpreadAttribute, elementAttributesType: Type, nameTable: Map<boolean>) {
            const type = checkExpression(node.expression);
            const props = getPropertiesOfType(type);
            for (const prop of props) {
                // Is there a corresponding property in the element attributes type? Skip checking of properties
                // that have already been assigned to, as these are not actually pushed into the resulting type
                if (!nameTable[prop.name]) {
                    const targetPropSym = getPropertyOfType(elementAttributesType, prop.name);
                    if (targetPropSym) {
                        const msg = chainDiagnosticMessages(undefined, Diagnostics.Property_0_of_JSX_spread_attribute_is_not_assignable_to_target_property, prop.name);
                        checkTypeAssignableTo(getTypeOfSymbol(prop), getTypeOfSymbol(targetPropSym), node, undefined, msg);
                    }

                    nameTable[prop.name] = true;
                }
            }
            return type;
        }

        function getJsxType(name: string) {
            if (jsxTypes[name] === undefined) {
                return jsxTypes[name] = getExportedTypeFromNamespace(JsxNames.JSX, name) || unknownType;
            }
            return jsxTypes[name];
        }

        /**
          * Looks up an intrinsic tag name and returns a symbol that either points to an intrinsic
          * property (in which case nodeLinks.jsxFlags will be IntrinsicNamedElement) or an intrinsic
          * string index signature (in which case nodeLinks.jsxFlags will be IntrinsicIndexedElement).
          * May also return unknownSymbol if both of these lookups fail.
          */
        function getIntrinsicTagSymbol(node: JsxOpeningLikeElement | JsxClosingElement): Symbol {
            const links = getNodeLinks(node);
            if (!links.resolvedSymbol) {
                const intrinsicElementsType = getJsxType(JsxNames.IntrinsicElements);
                if (intrinsicElementsType !== unknownType) {
                    // Property case
                    const intrinsicProp = getPropertyOfType(intrinsicElementsType, (<Identifier>node.tagName).text);
                    if (intrinsicProp) {
                        links.jsxFlags |= JsxFlags.IntrinsicNamedElement;
                        return links.resolvedSymbol = intrinsicProp;
                    }

                    // Intrinsic string indexer case
                    const indexSignatureType = getIndexTypeOfType(intrinsicElementsType, IndexKind.String);
                    if (indexSignatureType) {
                        links.jsxFlags |= JsxFlags.IntrinsicIndexedElement;
                        return links.resolvedSymbol = intrinsicElementsType.symbol;
                    }

                    // Wasn't found
                    error(node, Diagnostics.Property_0_does_not_exist_on_type_1, (<Identifier>node.tagName).text, "JSX." + JsxNames.IntrinsicElements);
                    return links.resolvedSymbol = unknownSymbol;
                }
                else {
                    if (compilerOptions.noImplicitAny) {
                        error(node, Diagnostics.JSX_element_implicitly_has_type_any_because_no_interface_JSX_0_exists, JsxNames.IntrinsicElements);
                    }
                    return links.resolvedSymbol = unknownSymbol;
                }
            }
            return links.resolvedSymbol;
        }

        /**
         * Given a JSX element that is a class element, finds the Element Instance Type. If the
         * element is not a class element, or the class element type cannot be determined, returns 'undefined'.
         * For example, in the element <MyClass>, the element instance type is `MyClass` (not `typeof MyClass`).
         */
        function getJsxElementInstanceType(node: JsxOpeningLikeElement, valueType: Type) {
            Debug.assert(!(valueType.flags & TypeFlags.Union));
            if (isTypeAny(valueType)) {
                // Short-circuit if the class tag is using an element type 'any'
                return anyType;
            }

            // Resolve the signatures, preferring constructor
            let signatures = getSignaturesOfType(valueType, SignatureKind.Construct);
            if (signatures.length === 0) {
                // No construct signatures, try call signatures
                signatures = getSignaturesOfType(valueType, SignatureKind.Call);
                if (signatures.length === 0) {
                    // We found no signatures at all, which is an error
                    error(node.tagName, Diagnostics.JSX_element_type_0_does_not_have_any_construct_or_call_signatures, getTextOfNode(node.tagName));
                    return unknownType;
                }
            }

            return getUnionType(signatures.map(getReturnTypeOfSignature), /*subtypeReduction*/ true);
        }

        /// e.g. "props" for React.d.ts,
        /// or 'undefined' if ElementAttributesProperty doesn't exist (which means all
        ///     non-intrinsic elements' attributes type is 'any'),
        /// or '' if it has 0 properties (which means every
        ///     non-intrinsic elements' attributes type is the element instance type)
        function getJsxElementPropertiesName() {
            // JSX
            const jsxNamespace = getGlobalSymbol(JsxNames.JSX, SymbolFlags.Namespace, /*diagnosticMessage*/undefined);
            // JSX.ElementAttributesProperty [symbol]
            const attribsPropTypeSym = jsxNamespace && getSymbol(jsxNamespace.exports, JsxNames.ElementAttributesPropertyNameContainer, SymbolFlags.Type);
            // JSX.ElementAttributesProperty [type]
            const attribPropType = attribsPropTypeSym && getDeclaredTypeOfSymbol(attribsPropTypeSym);
            // The properties of JSX.ElementAttributesProperty
            const attribProperties = attribPropType && getPropertiesOfType(attribPropType);

            if (attribProperties) {
                // Element Attributes has zero properties, so the element attributes type will be the class instance type
                if (attribProperties.length === 0) {
                    return "";
                }
                // Element Attributes has one property, so the element attributes type will be the type of the corresponding
                // property of the class instance type
                else if (attribProperties.length === 1) {
                    return attribProperties[0].name;
                }
                // More than one property on ElementAttributesProperty is an error
                else {
                    error(attribsPropTypeSym.declarations[0], Diagnostics.The_global_type_JSX_0_may_not_have_more_than_one_property, JsxNames.ElementAttributesPropertyNameContainer);
                    return undefined;
                }
            }
            else {
                // No interface exists, so the element attributes type will be an implicit any
                return undefined;
            }
        }

        /**
         * Given React element instance type and the class type, resolve the Jsx type
         * Pass elemType to handle individual type in the union typed element type.
         */
        function getResolvedJsxType(node: JsxOpeningLikeElement, elemType?: Type, elemClassType?: Type): Type {
            if (!elemType) {
                elemType = checkExpression(node.tagName);
            }
            if (elemType.flags & TypeFlags.Union) {
                const types = (<UnionOrIntersectionType>elemType).types;
                return getUnionType(types.map(type => {
                    return getResolvedJsxType(node, type, elemClassType);
                }), /*subtypeReduction*/ true);
            }

            // If the elemType is a string type, we have to return anyType to prevent an error downstream as we will try to find construct or call signature of the type
            if (elemType.flags & TypeFlags.String) {
                return anyType;
            }
            else if (elemType.flags & TypeFlags.StringLiteral) {
                // If the elemType is a stringLiteral type, we can then provide a check to make sure that the string literal type is one of the Jsx intrinsic element type
                const intrinsicElementsType = getJsxType(JsxNames.IntrinsicElements);
                if (intrinsicElementsType !== unknownType) {
                    const stringLiteralTypeName = (<LiteralType>elemType).text;
                    const intrinsicProp = getPropertyOfType(intrinsicElementsType, stringLiteralTypeName);
                    if (intrinsicProp) {
                        return getTypeOfSymbol(intrinsicProp);
                    }
                    const indexSignatureType = getIndexTypeOfType(intrinsicElementsType, IndexKind.String);
                    if (indexSignatureType) {
                        return indexSignatureType;
                    }
                    error(node, Diagnostics.Property_0_does_not_exist_on_type_1, stringLiteralTypeName, "JSX." + JsxNames.IntrinsicElements);
                }
                // If we need to report an error, we already done so here. So just return any to prevent any more error downstream
                return anyType;
            }

            // Get the element instance type (the result of newing or invoking this tag)
            const elemInstanceType = getJsxElementInstanceType(node, elemType);

            if (!elemClassType || !isTypeAssignableTo(elemInstanceType, elemClassType)) {
                // Is this is a stateless function component? See if its single signature's return type is
                // assignable to the JSX Element Type
                if (jsxElementType) {
                    const callSignatures = elemType && getSignaturesOfType(elemType, SignatureKind.Call);
                    const callSignature = callSignatures && callSignatures.length > 0 && callSignatures[0];
                    const callReturnType = callSignature && getReturnTypeOfSignature(callSignature);
                    let paramType = callReturnType && (callSignature.parameters.length === 0 ? emptyObjectType : getTypeOfSymbol(callSignature.parameters[0]));
                    if (callReturnType && isTypeAssignableTo(callReturnType, jsxElementType)) {
                        // Intersect in JSX.IntrinsicAttributes if it exists
                        const intrinsicAttributes = getJsxType(JsxNames.IntrinsicAttributes);
                        if (intrinsicAttributes !== unknownType) {
                            paramType = intersectTypes(intrinsicAttributes, paramType);
                        }
                        return paramType;
                    }
                }
            }

            // Issue an error if this return type isn't assignable to JSX.ElementClass
            if (elemClassType) {
                checkTypeAssignableTo(elemInstanceType, elemClassType, node, Diagnostics.JSX_element_type_0_is_not_a_constructor_function_for_JSX_elements);
            }

            if (isTypeAny(elemInstanceType)) {
                return elemInstanceType;
            }

            const propsName = getJsxElementPropertiesName();
            if (propsName === undefined) {
                // There is no type ElementAttributesProperty, return 'any'
                return anyType;
            }
            else if (propsName === "") {
                // If there is no e.g. 'props' member in ElementAttributesProperty, use the element class type instead
                return elemInstanceType;
            }
            else {
                const attributesType = getTypeOfPropertyOfType(elemInstanceType, propsName);

                if (!attributesType) {
                    // There is no property named 'props' on this instance type
                    return emptyObjectType;
                }
                else if (isTypeAny(attributesType) || (attributesType === unknownType)) {
                    // Props is of type 'any' or unknown
                    return attributesType;
                }
                else if (attributesType.flags & TypeFlags.Union) {
                    // Props cannot be a union type
                    error(node.tagName, Diagnostics.JSX_element_attributes_type_0_may_not_be_a_union_type, typeToString(attributesType));
                    return anyType;
                }
                else {
                    // Normal case -- add in IntrinsicClassElements<T> and IntrinsicElements
                    let apparentAttributesType = attributesType;
                    const intrinsicClassAttribs = getJsxType(JsxNames.IntrinsicClassAttributes);
                    if (intrinsicClassAttribs !== unknownType) {
                        const typeParams = getLocalTypeParametersOfClassOrInterfaceOrTypeAlias(intrinsicClassAttribs.symbol);
                        if (typeParams) {
                            if (typeParams.length === 1) {
                                apparentAttributesType = intersectTypes(createTypeReference(<GenericType>intrinsicClassAttribs, [elemInstanceType]), apparentAttributesType);
                            }
                        }
                        else {
                            apparentAttributesType = intersectTypes(attributesType, intrinsicClassAttribs);
                        }
                    }

                    const intrinsicAttribs = getJsxType(JsxNames.IntrinsicAttributes);
                    if (intrinsicAttribs !== unknownType) {
                        apparentAttributesType = intersectTypes(intrinsicAttribs, apparentAttributesType);
                    }

                    return apparentAttributesType;
                }
            }
        }

        /**
         * Given an opening/self-closing element, get the 'element attributes type', i.e. the type that tells
         * us which attributes are valid on a given element.
         */
        function getJsxElementAttributesType(node: JsxOpeningLikeElement): Type {
            const links = getNodeLinks(node);
            if (!links.resolvedJsxType) {
                if (isJsxIntrinsicIdentifier(node.tagName)) {
                    const symbol = getIntrinsicTagSymbol(node);
                    if (links.jsxFlags & JsxFlags.IntrinsicNamedElement) {
                        return links.resolvedJsxType = getTypeOfSymbol(symbol);
                    }
                    else if (links.jsxFlags & JsxFlags.IntrinsicIndexedElement) {
                        return links.resolvedJsxType = getIndexInfoOfSymbol(symbol, IndexKind.String).type;
                    }
                    else {
                        return links.resolvedJsxType = unknownType;
                    }
                }
                else {
                    const elemClassType = getJsxGlobalElementClassType();
                    return links.resolvedJsxType = getResolvedJsxType(node, undefined, elemClassType);
                }
            }
            return links.resolvedJsxType;
        }

        /**
         * Given a JSX attribute, returns the symbol for the corresponds property
         * of the element attributes type. Will return unknownSymbol for attributes
         * that have no matching element attributes type property.
         */
        function getJsxAttributePropertySymbol(attrib: JsxAttribute): Symbol {
            const attributesType = getJsxElementAttributesType(<JsxOpeningElement>attrib.parent);
            const prop = getPropertyOfType(attributesType, attrib.name.text);
            return prop || unknownSymbol;
        }

        function getJsxGlobalElementClassType(): Type {
            if (!jsxElementClassType) {
                jsxElementClassType = getExportedTypeFromNamespace(JsxNames.JSX, JsxNames.ElementClass);
            }
            return jsxElementClassType;
        }

        /// Returns all the properties of the Jsx.IntrinsicElements interface
        function getJsxIntrinsicTagNames(): Symbol[] {
            const intrinsics = getJsxType(JsxNames.IntrinsicElements);
            return intrinsics ? getPropertiesOfType(intrinsics) : emptyArray;
        }

        function checkJsxPreconditions(errorNode: Node) {
            // Preconditions for using JSX
            if ((compilerOptions.jsx || JsxEmit.None) === JsxEmit.None) {
                error(errorNode, Diagnostics.Cannot_use_JSX_unless_the_jsx_flag_is_provided);
            }

            if (jsxElementType === undefined) {
                if (compilerOptions.noImplicitAny) {
                    error(errorNode, Diagnostics.JSX_element_implicitly_has_type_any_because_the_global_type_JSX_Element_does_not_exist);
                }
            }
        }

        function checkGrammarJsxElement(node: JsxOpeningLikeElement) {
            const seen = createMap<boolean>();
            for (const attr of node.attributes) {
                if (attr.kind === SyntaxKind.JsxSpreadAttribute) {
                    continue;
                }

                const jsxAttr = (<JsxAttribute>attr);
                const name = jsxAttr.name;
                if (!seen[name.text]) {
                    seen[name.text] = true;
                }
                else {
                    return grammarErrorOnNode(name, Diagnostics.JSX_elements_cannot_have_multiple_attributes_with_the_same_name);
                }

                const initializer = jsxAttr.initializer;
                if (initializer && initializer.kind === SyntaxKind.JsxExpression && !(<JsxExpression>initializer).expression) {
                    return grammarErrorOnNode(jsxAttr.initializer, Diagnostics.JSX_attributes_must_only_be_assigned_a_non_empty_expression);
                }
            }
        }

        function checkJsxOpeningLikeElement(node: JsxOpeningLikeElement) {
            checkGrammarJsxElement(node);
            checkJsxPreconditions(node);

            // The reactNamespace symbol should be marked as 'used' so we don't incorrectly elide its import. And if there
            // is no reactNamespace symbol in scope when targeting React emit, we should issue an error.
            const reactRefErr = compilerOptions.jsx === JsxEmit.React ? Diagnostics.Cannot_find_name_0 : undefined;
            const reactNamespace = compilerOptions.reactNamespace ? compilerOptions.reactNamespace : "React";
            const reactSym = resolveName(node.tagName, reactNamespace, SymbolFlags.Value, reactRefErr, reactNamespace);
            if (reactSym) {
                getSymbolLinks(reactSym).referenced = true;
            }

            const targetAttributesType = getJsxElementAttributesType(node);

            const nameTable = createMap<boolean>();
            // Process this array in right-to-left order so we know which
            // attributes (mostly from spreads) are being overwritten and
            // thus should have their types ignored
            let sawSpreadedAny = false;
            for (let i = node.attributes.length - 1; i >= 0; i--) {
                if (node.attributes[i].kind === SyntaxKind.JsxAttribute) {
                    checkJsxAttribute(<JsxAttribute>(node.attributes[i]), targetAttributesType, nameTable);
                }
                else {
                    Debug.assert(node.attributes[i].kind === SyntaxKind.JsxSpreadAttribute);
                    const spreadType = checkJsxSpreadAttribute(<JsxSpreadAttribute>(node.attributes[i]), targetAttributesType, nameTable);
                    if (isTypeAny(spreadType)) {
                        sawSpreadedAny = true;
                    }
                }
            }

            // Check that all required properties have been provided. If an 'any'
            // was spreaded in, though, assume that it provided all required properties
            if (targetAttributesType && !sawSpreadedAny) {
                const targetProperties = getPropertiesOfType(targetAttributesType);
                for (let i = 0; i < targetProperties.length; i++) {
                    if (!(targetProperties[i].flags & SymbolFlags.Optional) &&
                        !nameTable[targetProperties[i].name]) {

                        error(node, Diagnostics.Property_0_is_missing_in_type_1, targetProperties[i].name, typeToString(targetAttributesType));
                    }
                }
            }
        }

        function checkJsxExpression(node: JsxExpression) {
            if (node.expression) {
                return checkExpression(node.expression);
            }
            else {
                return unknownType;
            }
        }
    }
}
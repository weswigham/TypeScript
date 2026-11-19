package astnav

import (
	"fmt"
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func shouldRescanLessThanLessThanToken(s *scanner.Scanner, containingNode *ast.Node, token ast.Kind) bool {
	return token == ast.KindLessThanLessThanToken && ast.IsJsxChild(containingNode)
}

func scanNavigationToken(s *scanner.Scanner, containingNode *ast.Node) ast.Kind {
	token := s.Token()
	if shouldRescanLessThanLessThanToken(s, containingNode, token) {
		return s.ReScanJsxToken(true /*allowMultilineJsxText*/)
	}
	return token
}

func GetTouchingPropertyName(sourceFile *ast.SourceFile, position int) *ast.Node {
	return getTokenAtPosition(sourceFile, position, false /*allowPositionInLeadingTrivia*/, func(node *ast.Node) bool {
		return ast.IsPropertyNameLiteral(node) || ast.IsKeywordKind(node.Kind) || ast.IsPrivateIdentifier(node)
	})
}

func GetTouchingToken(sourceFile *ast.SourceFile, position int) *ast.Node {
	return getTokenAtPosition(sourceFile, position, false /*allowPositionInLeadingTrivia*/, nil)
}

func GetTokenAtPosition(sourceFile *ast.SourceFile, position int) *ast.Node {
	return getTokenAtPosition(sourceFile, position, true /*allowPositionInLeadingTrivia*/, nil)
}

type tokenPositionState struct {
	sourceFile                         *ast.SourceFile
	position                           int
	allowPositionInLeadingTrivia       bool
	includePrecedingTokenAtEndPosition func(*ast.Node) bool
	// `next` is the next subtree to inspect; `prevSubtree` ends at the target position.
	next, prevSubtree *ast.Node
	// `left` is the lower search boundary and the scanner's starting position.
	left int
	// `nodeAfterLeft` bounds scanning between two AST children.
	nodeAfterLeft *ast.Node
	searchNodes   []*ast.Node
}

func getTokenAtPosition(
	sourceFile *ast.SourceFile,
	position int,
	allowPositionInLeadingTrivia bool,
	includePrecedingTokenAtEndPosition func(node *ast.Node) bool,
) *ast.Node {
	navigation := tokenPositionState{
		sourceFile:                         sourceFile,
		position:                           position,
		allowPositionInLeadingTrivia:       allowPositionInLeadingTrivia,
		includePrecedingTokenAtEndPosition: includePrecedingTokenAtEndPosition,
	}
	return navigation.find()
}

func (s *tokenPositionState) find() *ast.Node {
	// getTokenAtPosition returns a token at the given position in the source file.
	// The token can be a real node in the AST, or a synthesized token constructed
	// with information from the scanner. Synthesized tokens are only created when
	// needed, and they are stored in the source file's token cache such that multiple
	// calls to getTokenAtPosition with the same position will return the same object
	// in memory. If there is no token at the given position (possible when
	// `allowPositionInLeadingTrivia` is false), the lowest node that encloses the
	// position is returned.

	current := s.sourceFile.AsNode()
	// We zero in on the node that contains the target position by visiting each
	// child and JSDoc comment of the current node. Node children are walked in
	// order, while node lists are binary searched.

	visitor := getNodeVisitor(s.visitNode, s.visitNodeList)
	for {
		visitEachChildAndJSDoc(current, s.sourceFile, visitor)
		// If prevSubtree was set on the last iteration, it ends at the target position.
		// Check if the rightmost token of prevSubtree should be returned based on the
		// `includePrecedingTokenAtEndPosition` callback.
		if s.prevSubtree != nil {
			if child := s.getIncludedPrecedingToken(s.prevSubtree); child != nil {
				// Optimization: includePrecedingTokenAtEndPosition only ever returns true
				// for real AST nodes, so we don't run the scanner here.
				return child
			}
			s.prevSubtree = nil
		}

		// No node was found that contains the target position, so we've gone as deep as
		// we can in the AST. We've either found a token, or we need to run the scanner
		// to construct one that isn't stored in the AST.
		if s.next == nil {
			if ast.IsTokenKind(current.Kind) || shouldSkipChild(current) {
				return current
			}
			scanner := scanner.GetScannerForSourceFile(s.sourceFile, s.left)
			end := current.End()
			// We should only scan up to the start of the next node in the AST after the node ending at position `left`.
			// It is necessary to enforce this invariant in cases where `position` occurs in between two node/tokens,
			// such that we would not find a token in the loop below before we reach the next node.
			// We can fall into this case when `allowPositionInLeadingTrivia` is false and `position` is in a leading trivia,
			// or when `position` would be in the leading trivia of a node but this node is inside JSDoc:
			// ```
			// /**
			//  * @type {{
			//  */*$*/ identifier: boolean;
			//  * }}
			//  */
			// ```
			// The position of marker '$' falls in between the asterisk token and the identifier token, but is not
			// part of the leading trivia for `identifier`.
			if s.nodeAfterLeft != nil {
				end = s.nodeAfterLeft.Pos()
			}
			for s.left < end {
				token := scanNavigationToken(scanner, current)
				tokenFullStart := scanner.TokenFullStart()
				tokenStart := core.IfElse(s.allowPositionInLeadingTrivia, tokenFullStart, scanner.TokenStart())
				tokenEnd := scanner.TokenEnd()
				flags := scanner.TokenFlags()
				if tokenEnd > end {
					break
				}
				if tokenStart <= s.position && (s.position < tokenEnd) {
					if token == ast.KindIdentifier || !ast.IsTokenKind(token) {
						if ast.IsJSDocKind(current.Kind) {
							return current
						}
						panic(fmt.Sprintf("did not expect %s to have %s in its trivia", current.Kind.String(), token.String()))
					}
					return s.sourceFile.GetOrCreateToken(token, tokenFullStart, tokenEnd, current, flags)
				}
				if s.includePrecedingTokenAtEndPosition != nil && tokenEnd == s.position {
					prevToken := s.sourceFile.GetOrCreateToken(token, tokenFullStart, tokenEnd, current, flags)
					if s.includePrecedingTokenAtEndPosition(prevToken) {
						return prevToken
					}
				}
				s.left = tokenEnd
				scanner.Scan()
			}
			return current
		}
		current = s.next
		s.left = current.Pos()
		s.nodeAfterLeft = nil
		s.next = nil
	}
}

func (s *tokenPositionState) getIncludedPrecedingToken(subtree *ast.Node) *ast.Node {
	child := FindPrecedingTokenEx(s.sourceFile, s.position, subtree, false /*excludeJSDoc*/)
	if child != nil && child.End() == s.position && s.includePrecedingTokenAtEndPosition(child) {
		return child
	}
	return nil
}

func (s *tokenPositionState) testNode(node *ast.Node) int {
	if node.Kind != ast.KindEndOfFile && node.End() == s.position &&
		s.includePrecedingTokenAtEndPosition != nil && node.Flags&ast.NodeFlagsReparsed == 0 {
		if s.prevSubtree != nil && s.getIncludedPrecedingToken(s.prevSubtree) != nil {
			return 0
		}
		s.prevSubtree = node
	}

	// A node "contains" the position if position < end, except nodes at the file end
	// treat end as inclusive (there's nowhere else to look). This applies to the EOF
	// token itself, and to JSDoc nodes reaching EOF (e.g. unterminated JSDoc comments).
	if node.End() < s.position || node.End() == s.position &&
		node.Kind != ast.KindEndOfFile &&
		(!ast.IsJSDocKind(node.Kind) || node.End() != s.sourceFile.EndOfFileToken.End()) {
		return -1
	}
	nodePos := getPosition(node, s.sourceFile, s.allowPositionInLeadingTrivia)
	if nodePos > s.position {
		return 1
	}
	return 0
}

func (s *tokenPositionState) visitNode(node *ast.Node, _ *ast.NodeVisitor) *ast.Node {
	// We can't abort visiting children, so once a match is found, we set `next`
	// and do nothing on subsequent visits.
	if node == nil || node.Flags&ast.NodeFlagsReparsed != 0 {
		return nil
	}
	if s.nodeAfterLeft == nil {
		s.nodeAfterLeft = node
	}
	if s.next == nil {
		result := s.testNode(node)
		switch result {
		case -1:
			if !ast.IsJSDocKind(node.Kind) {
				// We can't move the left boundary into or beyond JSDoc,
				// because we may end up returning the token after this JSDoc,
				// constructing it with the scanner, and we need to include
				// all its leading trivia in its position.
				s.left = node.End()
			}
			s.nodeAfterLeft = nil
		case 0:
			s.next = node
		}
	}
	return node
}

func (s *tokenPositionState) visitNodeList(nodeList *ast.NodeList, _ *ast.NodeVisitor) *ast.NodeList {
	if nodeList == nil || len(nodeList.Nodes) == 0 {
		return nodeList
	}
	if s.nodeAfterLeft == nil {
		for _, node := range nodeList.Nodes {
			if node.Flags&ast.NodeFlagsReparsed == 0 {
				s.nodeAfterLeft = node
				break
			}
		}
	}
	if s.next == nil {
		if nodeList.End() == s.position && s.includePrecedingTokenAtEndPosition != nil {
			s.left = nodeList.End()
			s.nodeAfterLeft = nil
			for _, v := range slices.Backward(nodeList.Nodes) {
				if v.Flags&ast.NodeFlagsReparsed == 0 {
					s.prevSubtree = v
					break
				}
			}
		} else if nodeList.End() <= s.position {
			s.left = nodeList.End()
			s.nodeAfterLeft = nil
		} else if nodeList.Pos() <= s.position {
			nodes := nodeList.Nodes
			s.searchNodes = nodes
			index, match := core.BinarySearchUniqueFunc(nodes, s.compareNode)
			if match && nodes[index].Flags&ast.NodeFlagsReparsed != 0 {
				// filter and search again
				nodes = core.Filter(nodes, func(node *ast.Node) bool {
					return node.Flags&ast.NodeFlagsReparsed == 0
				})
				s.searchNodes = nodes
				index, match = core.BinarySearchUniqueFunc(nodes, s.compareFilteredNode)
			}
			if match {
				s.next = nodes[index]
			}
		}
	}
	return nodeList
}

func (s *tokenPositionState) compareNode(middle int, node *ast.Node) int {
	if node.Flags&ast.NodeFlagsReparsed != 0 {
		return 0
	}
	cmp := s.testNode(node)
	if cmp < 0 {
		s.left = node.End()
		s.nodeAfterLeft = nil
		for i := middle + 1; i < len(s.searchNodes); i++ {
			if s.searchNodes[i].Flags&ast.NodeFlagsReparsed == 0 {
				s.nodeAfterLeft = s.searchNodes[i]
				break
			}
		}
	}
	return cmp
}

func (s *tokenPositionState) compareFilteredNode(middle int, node *ast.Node) int {
	cmp := s.testNode(node)
	if cmp < 0 {
		s.left = node.End()
		if middle+1 < len(s.searchNodes) {
			s.nodeAfterLeft = s.searchNodes[middle+1]
		} else {
			s.nodeAfterLeft = nil
		}
	}
	return cmp
}

func getPosition(node *ast.Node, sourceFile *ast.SourceFile, allowPositionInLeadingTrivia bool) int {
	if allowPositionInLeadingTrivia {
		return node.Pos()
	}
	return scanner.GetTokenPosOfNode(node, sourceFile, true /*includeJSDoc*/)
}

type rightmostNodeState struct {
	next *ast.Node
}

func findRightmostNode(node *ast.Node) *ast.Node {
	navigation := rightmostNodeState{}
	return navigation.find(node)
}

func (s *rightmostNodeState) find(node *ast.Node) *ast.Node {
	current := node

	visitor := getNodeVisitor(s.visitNode, s.visitNodes)

	for {
		current.VisitEachChild(visitor)
		if s.next == nil {
			return current
		}
		current = s.next
		s.next = nil
	}
}

func (s *rightmostNodeState) visitNode(node *ast.Node, _ *ast.NodeVisitor) *ast.Node {
	if node != nil {
		s.next = node
	}
	return node
}

func (s *rightmostNodeState) visitNodes(nodeList *ast.NodeList, visitor *ast.NodeVisitor) *ast.NodeList {
	if nodeList != nil {
		if rightmost := ast.FindLastVisibleNode(nodeList.Nodes); rightmost != nil {
			s.next = rightmost
		}
	}
	return nodeList
}

func VisitEachChildAndJSDoc(
	node *ast.Node,
	sourceFile *ast.SourceFile,
	visitNode func(*ast.Node, *ast.NodeVisitor) *ast.Node,
	visitNodes func(*ast.NodeList, *ast.NodeVisitor) *ast.NodeList,
) {
	visitEachChildAndJSDoc(node, sourceFile, getNodeVisitor(visitNode, visitNodes))
}

func visitEachChildAndJSDoc(node *ast.Node, sourceFile *ast.SourceFile, visitor *ast.NodeVisitor) {
	for _, jsdoc := range node.JSDoc(sourceFile) {
		if visitor.Hooks.VisitNode != nil {
			visitor.Hooks.VisitNode(jsdoc, visitor)
		} else {
			visitor.VisitNode(jsdoc)
		}
	}
	node.VisitEachChild(visitor)
}

const (
	comparisonLessThan    = -1
	comparisonEqualTo     = 0
	comparisonGreaterThan = 1
)

// Finds the leftmost token satisfying `position < token.End()`.
// If the leftmost token satisfying `position < token.End()` is invalid, or if position
// is in the trivia of that leftmost token,
// we will find the rightmost valid token with `token.End() <= position`.
func FindPrecedingToken(sourceFile *ast.SourceFile, position int) *ast.Node {
	return FindPrecedingTokenEx(sourceFile, position, nil, false)
}

type precedingTokenState struct {
	sourceFile            *ast.SourceFile
	position              int
	excludeJSDoc          bool
	foundChild, prevChild *ast.Node
	visitor               *ast.NodeVisitor
	searchNodes           []*ast.Node
}

func FindPrecedingTokenEx(sourceFile *ast.SourceFile, position int, startNode *ast.Node, excludeJSDoc bool) *ast.Node {
	navigation := precedingTokenState{sourceFile: sourceFile, position: position, excludeJSDoc: excludeJSDoc}

	var node *ast.Node
	if startNode != nil {
		node = startNode
	} else {
		node = sourceFile.AsNode()
	}
	result := navigation.find(node)
	if result != nil && ast.IsWhitespaceOnlyJsxText(result) {
		panic("Expected result to be a non-whitespace token.")
	}
	return result
}

func (s *precedingTokenState) visitNode(node *ast.Node, _ *ast.NodeVisitor) *ast.Node {
	// skip synthesized nodes (that will exist now because of jsdoc handling)
	if node == nil || node.Flags&ast.NodeFlagsReparsed != 0 {
		return node
	}
	if s.foundChild != nil { // We cannot abort visiting children, so once the desired child is found, we do nothing.
		return node
	}
	if s.position < node.End() && (s.prevChild == nil || s.prevChild.End() <= s.position) {
		s.foundChild = node
	} else {
		s.prevChild = node
	}
	return node
}

func (s *precedingTokenState) visitNodes(nodeList *ast.NodeList, _ *ast.NodeVisitor) *ast.NodeList {
	if s.foundChild != nil {
		return nodeList
	}
	if nodeList != nil && len(nodeList.Nodes) > 0 {
		nodes := nodeList.Nodes
		s.searchNodes = nodes
		index, match := core.BinarySearchUniqueFunc(nodes, s.compareNode)

		if match {
			s.foundChild = nodes[index]
		}

		validLookupIndex := core.IfElse(match, index-1, len(nodes)-1)
		for i := validLookupIndex; i >= 0; i-- {
			if nodes[i].Flags&ast.NodeFlagsReparsed != 0 {
				continue
			}
			if s.prevChild == nil {
				s.prevChild = nodes[i]
			}
		}
	}
	return nodeList
}

func (s *precedingTokenState) compareNode(middle int, node *ast.Node) int {
	// Synthetic JSDoc nodes should end before the containing node starts.
	if node.Flags&ast.NodeFlagsReparsed != 0 {
		return comparisonLessThan
	}
	if s.position < node.End() {
		if middle == 0 || s.position >= s.searchNodes[middle-1].End() {
			return comparisonEqualTo
		}
		return comparisonGreaterThan
	}
	return comparisonLessThan
}

func (s *precedingTokenState) find(n *ast.Node) *ast.Node {
	if ast.IsNonWhitespaceToken(n) && n.Kind != ast.KindEndOfFile {
		return n
	}
	s.foundChild, s.prevChild = nil, nil
	if s.visitor == nil {
		s.visitor = getNodeVisitor(s.visitNode, s.visitNodes)
	}
	visitEachChildAndJSDoc(n, s.sourceFile, s.visitor)

	if s.foundChild != nil {
		// Note that the span of a node's tokens is [getStartOfNode(node, ...), node.end).
		// Given that `position < child.end` and child has constituent tokens, we distinguish these cases:
		// 1) `position` precedes `child`'s tokens or `child` has no tokens (ie: in a comment or whitespace preceding `child`):
		// we need to find the last token in a previous child node or child tokens.
		// 2) `position` is within the same span: we recurse on `child`.
		start := GetStartOfNode(s.foundChild, s.sourceFile, !s.excludeJSDoc /*includeJSDoc*/)
		lookInPreviousChild := start >= s.position || // cursor in the leading trivia or preceding tokens
			!isValidPrecedingNode(s.foundChild, s.sourceFile)
		if lookInPreviousChild {
			if s.position >= s.foundChild.Pos() {
				// Find jsdoc preceding the foundChild.
				var jsDoc *ast.Node
				nodeJSDoc := n.JSDoc(s.sourceFile)
				for _, n := range slices.Backward(nodeJSDoc) {
					if n.Pos() >= s.foundChild.Pos() {
						jsDoc = n
						break
					}
				}
				if jsDoc != nil {
					if !s.excludeJSDoc && s.position < jsDoc.End() {
						return s.find(jsDoc)
					} else {
						return findRightmostValidToken(jsDoc.End(), s.sourceFile, n, s.position, s.excludeJSDoc)
					}
				}
				return findRightmostValidToken(s.foundChild.Pos(), s.sourceFile, n, -1 /*position*/, s.excludeJSDoc)
			} else { // Answer is in tokens between two visited children.
				return findRightmostValidToken(s.foundChild.Pos(), s.sourceFile, n, s.position, s.excludeJSDoc)
			}
		} else {
			// position is in [foundChild.getStart(), foundChild.End): recur.
			return s.find(s.foundChild)
		}
	}

	// We have two cases here: either the position is at the end of the file,
	// or the desired token is in the unvisited trailing tokens of the current node.
	if s.position >= n.End() {
		return findRightmostValidToken(n.End(), s.sourceFile, n, -1 /*position*/, s.excludeJSDoc)
	} else {
		return findRightmostValidToken(n.End(), s.sourceFile, n, s.position, s.excludeJSDoc)
	}
}

func isValidPrecedingNode(node *ast.Node, sourceFile *ast.SourceFile) bool {
	if node.Kind == ast.KindEndOfFile {
		return len(node.JSDoc(sourceFile)) > 0
	}
	start := GetStartOfNode(node, sourceFile, false /*includeJSDoc*/)
	width := node.End() - start
	return !(ast.IsWhitespaceOnlyJsxText(node) || width == 0)
}

func GetStartOfNode(node *ast.Node, file *ast.SourceFile, includeJSDoc bool) int {
	return scanner.GetTokenPosOfNode(node, file, includeJSDoc)
}

type rightmostTokenState struct {
	sourceFile            *ast.SourceFile
	containingNode        *ast.Node
	position, endPos      int
	excludeJSDoc          bool
	rightmostValidNode    *ast.Node
	rightmostVisitedNodes []*ast.Node
	hasChildren           bool
	visitor               *ast.NodeVisitor
}

// Looks for rightmost valid token in the range [startPos, endPos).
// If position is >= 0, looks for rightmost valid token that precedes or touches that position.
func findRightmostValidToken(endPos int, sourceFile *ast.SourceFile, containingNode *ast.Node, position int, excludeJSDoc bool) *ast.Node {
	if position == -1 {
		position = containingNode.End()
	}
	navigation := rightmostTokenState{
		sourceFile:            sourceFile,
		containingNode:        containingNode,
		position:              position,
		excludeJSDoc:          excludeJSDoc,
		rightmostVisitedNodes: make([]*ast.Node, 0, 1),
	}
	return navigation.find(containingNode, endPos)
}

func (s *rightmostTokenState) shouldVisitNode(node *ast.Node) bool {
	// Node is synthetic or out of the desired range: don't visit it.
	return !(node.Flags&ast.NodeFlagsReparsed != 0 ||
		node.End() > s.endPos || GetStartOfNode(node, s.sourceFile, !s.excludeJSDoc /*includeJSDoc*/) >= s.position)
}

func (s *rightmostTokenState) visitNode(node *ast.Node, _ *ast.NodeVisitor) *ast.Node {
	if node == nil || node.Flags&ast.NodeFlagsReparsed != 0 {
		return node
	}
	s.hasChildren = true
	if !s.shouldVisitNode(node) {
		return node
	}
	s.rightmostVisitedNodes = append(s.rightmostVisitedNodes, node)
	if isValidPrecedingNode(node, s.sourceFile) {
		s.rightmostValidNode = node
		s.rightmostVisitedNodes = s.rightmostVisitedNodes[:0]
	}
	return node
}

func (s *rightmostTokenState) visitNodes(nodeList *ast.NodeList, _ *ast.NodeVisitor) *ast.NodeList {
	if nodeList != nil && len(nodeList.Nodes) > 0 {
		s.hasChildren = true
		index, _ := core.BinarySearchUniqueFunc(nodeList.Nodes, s.compareNode)
		validIndex := -1
		for i := index - 1; i >= 0; i-- {
			if !s.shouldVisitNode(nodeList.Nodes[i]) {
				continue
			}
			if isValidPrecedingNode(nodeList.Nodes[i], s.sourceFile) {
				validIndex = i
				s.rightmostValidNode = nodeList.Nodes[i]
				break
			}
		}
		for i := validIndex + 1; i < index; i++ {
			if !s.shouldVisitNode(nodeList.Nodes[i]) {
				continue
			}
			s.rightmostVisitedNodes = append(s.rightmostVisitedNodes, nodeList.Nodes[i])
		}
	}
	return nodeList
}

func (s *rightmostTokenState) compareNode(_ int, node *ast.Node) int {
	if node.End() > s.endPos {
		return comparisonGreaterThan
	}
	return comparisonLessThan
}

func (s *rightmostTokenState) find(n *ast.Node, limit int) *ast.Node {
	if n == nil {
		return nil
	}
	if ast.IsNonWhitespaceToken(n) {
		return n
	}
	s.endPos = limit
	s.rightmostValidNode = nil
	s.rightmostVisitedNodes = s.rightmostVisitedNodes[:0]
	s.hasChildren = false
	if s.visitor == nil {
		s.visitor = getNodeVisitor(s.visitNode, s.visitNodes)
	}
	visitEachChildAndJSDoc(n, s.sourceFile, s.visitor)

	// Three cases:
	// 1. The answer is a token of `rightmostValidNode`.
	// 2. The answer is one of the unvisited tokens that occur after the rightmost valid node.
	// 3. The current node is a childless, token-less node. The answer is the current node.

	// Case 2: Look at unvisited trailing tokens that occur in between the rightmost visited nodes.
	startPos := n.Pos()
	if s.rightmostValidNode != nil {
		startPos = s.rightmostValidNode.End()
	}
	if !shouldSkipChild(n) && (len(s.rightmostVisitedNodes) != 0 || startPos < min(s.endPos, s.position)) {
		scanner := scanner.GetScannerForSourceFile(s.sourceFile, startPos)
		var tokens []*ast.Node
		for _, visitedNode := range s.rightmostVisitedNodes {
			// Trailing tokens that occur before this node.
			for startPos < min(visitedNode.Pos(), s.position) {
				token := scanNavigationToken(scanner, n)
				tokenStart := scanner.TokenStart()
				if tokenStart >= min(visitedNode.Pos(), s.position) {
					break
				}
				tokenFullStart := scanner.TokenFullStart()
				tokenEnd := scanner.TokenEnd()
				startPos = tokenEnd
				flags := scanner.TokenFlags()
				tokens = append(tokens, s.sourceFile.GetOrCreateToken(token, tokenFullStart, tokenEnd, n, flags))
				scanner.Scan()
			}
			startPos = visitedNode.End()
			scanner.ResetPos(startPos)
			scanner.Scan()
		}
		// Trailing tokens after last visited node.
		for startPos < min(s.endPos, s.position) {
			token := scanNavigationToken(scanner, n)
			tokenStart := scanner.TokenStart()
			if tokenStart >= min(s.endPos, s.position) {
				break
			}
			tokenFullStart := scanner.TokenFullStart()
			tokenEnd := scanner.TokenEnd()
			startPos = tokenEnd
			flags := scanner.TokenFlags()
			tokens = append(tokens, s.sourceFile.GetOrCreateToken(token, tokenFullStart, tokenEnd, n, flags))
			scanner.Scan()
		}

		lastToken := len(tokens) - 1
		// Find preceding valid token.
		for i := lastToken; i >= 0; i-- {
			if !ast.IsWhitespaceOnlyJsxText(tokens[i]) {
				return tokens[i]
			}
		}
	}

	// Case 3: childless node.
	if !s.hasChildren {
		if n != s.containingNode {
			return n
		}
		return nil
	}
	// Case 1: recur on rightmostValidNode.
	if s.rightmostValidNode != nil {
		s.endPos = s.rightmostValidNode.End()
	}
	return s.find(s.rightmostValidNode, s.endPos)
}

type nextTokenState struct {
	previousToken *ast.Node
	file          *ast.SourceFile
	foundNode     *ast.Node
	visitor       *ast.NodeVisitor
}

func FindNextToken(previousToken *ast.Node, parent *ast.Node, file *ast.SourceFile) *ast.Node {
	navigation := nextTokenState{previousToken: previousToken, file: file}
	return navigation.find(parent)
}

func (s *nextTokenState) visitNode(node *ast.Node, _ *ast.NodeVisitor) *ast.Node {
	if node != nil && node.Flags&ast.NodeFlagsReparsed == 0 &&
		node.Pos() <= s.previousToken.End() && node.End() > s.previousToken.End() {
		s.foundNode = node
	}
	return node
}

func (s *nextTokenState) visitNodes(nodeList *ast.NodeList, _ *ast.NodeVisitor) *ast.NodeList {
	if nodeList != nil && len(nodeList.Nodes) > 0 && s.foundNode == nil {
		nodes := nodeList.Nodes
		index, match := core.BinarySearchUniqueFunc(nodes, s.compareNode)
		if match {
			s.foundNode = nodes[index]
		}
	}
	return nodeList
}

func (s *nextTokenState) compareNode(_ int, node *ast.Node) int {
	if node.Flags&ast.NodeFlagsReparsed != 0 {
		return comparisonLessThan
	}
	if node.Pos() > s.previousToken.End() {
		return comparisonGreaterThan
	}
	if node.End() <= s.previousToken.Pos() {
		return comparisonLessThan
	}
	return comparisonEqualTo
}

func (s *nextTokenState) find(n *ast.Node) *ast.Node {
	if ast.IsTokenKind(n.Kind) && n.Pos() == s.previousToken.End() {
		// this is token that starts at the end of previous token - return it
		return n
	}
	s.foundNode = nil
	if s.visitor == nil {
		s.visitor = getNodeVisitor(s.visitNode, s.visitNodes)
	}
	visitEachChildAndJSDoc(n, s.file, s.visitor)
	// Cases:
	// 1. no answer exists
	// 2. answer is an unvisited token
	// 3. answer is in the visited found node

	// Case 3: look for the next token inside the found node.
	if s.foundNode != nil {
		return s.find(s.foundNode)
	}
	startPos := s.previousToken.End()
	// Case 2: look for the next token directly.
	if startPos >= n.Pos() && startPos < n.End() {
		scanner := scanner.GetScannerForSourceFile(s.file, startPos)
		token := scanner.Token()
		tokenFullStart := scanner.TokenFullStart()
		tokenEnd := scanner.TokenEnd()
		flags := scanner.TokenFlags()
		// Use tokenFullStart (which includes leading trivia) to match TS's
		// findNextToken behavior where `n.pos === previousToken.end` is checked
		// (TS's pos includes trivia, same as Go's Pos()/tokenFullStart).
		if tokenFullStart == s.previousToken.End() {
			return s.file.GetOrCreateToken(token, tokenFullStart, tokenEnd, n, flags)
		}
		panic(fmt.Sprintf("Expected to find next token at %d, got token %s at %d", s.previousToken.End(), token, tokenFullStart))
	}
	// Case 3: no answer.
	return nil
}

type nodeVisitorState struct {
	visitor           ast.NodeVisitor
	factory           ast.NodeFactory
	visitNodeCallback func(*ast.Node, *ast.NodeVisitor) *ast.Node
	visitListCallback func(*ast.NodeList, *ast.NodeVisitor) *ast.NodeList
	wrappedVisitNodes func(*ast.NodeList, *ast.NodeVisitor) *ast.NodeList
}

func getNodeVisitor(
	visitNode func(*ast.Node, *ast.NodeVisitor) *ast.Node,
	visitNodes func(*ast.NodeList, *ast.NodeVisitor) *ast.NodeList,
) *ast.NodeVisitor {
	state := &nodeVisitorState{visitNodeCallback: visitNode, visitListCallback: visitNodes}
	hooks := ast.NodeVisitorHooks{VisitModifiers: state.visitModifiers}
	if visitNode != nil {
		hook := state.visitNode
		hooks.VisitNode, hooks.VisitToken = hook, hook
	}
	if visitNodes != nil {
		state.wrappedVisitNodes = state.visitNodes
		hooks.VisitNodes = state.wrappedVisitNodes
	}
	state.visitor = *ast.NewNodeVisitor(core.Identity, &state.factory, hooks)
	return &state.visitor
}

func (s *nodeVisitorState) visitNode(node *ast.Node, visitor *ast.NodeVisitor) *ast.Node {
	if ast.IsJSDocSingleCommentNodeComment(node) {
		return node
	}
	return s.visitNodeCallback(node, visitor)
}

func (s *nodeVisitorState) visitNodes(nodes *ast.NodeList, visitor *ast.NodeVisitor) *ast.NodeList {
	if ast.IsJSDocSingleCommentNodeList(nodes) {
		return nodes
	}
	return s.visitListCallback(nodes, visitor)
}

func (s *nodeVisitorState) visitModifiers(modifiers *ast.ModifierList, visitor *ast.NodeVisitor) *ast.ModifierList {
	if modifiers != nil {
		s.wrappedVisitNodes(&modifiers.NodeList, visitor)
	}
	return modifiers
}

func shouldSkipChild(node *ast.Node) bool {
	return node.Kind == ast.KindJSDoc ||
		node.Kind == ast.KindJSDocText ||
		node.Kind == ast.KindJSDocTypeLiteral ||
		node.Kind == ast.KindJSDocSignature ||
		ast.IsJSDocLinkLike(node) ||
		ast.IsJSDocTag(node)
}

// FindChildOfKind searches for a child node or token of the specified kind within a containing node.
// This function scans through both AST nodes and intervening tokens to find the first match.
func FindChildOfKind(containingNode *ast.Node, kind ast.Kind, sourceFile *ast.SourceFile) *ast.Node {
	lastNodePos := containingNode.Pos()
	scan := scanner.GetScannerForSourceFile(sourceFile, lastNodePos)

	var foundChild *ast.Node
	visitNode := func(node *ast.Node) bool {
		if node == nil || node.Flags&ast.NodeFlagsReparsed != 0 {
			return false
		}
		// Look for child in preceding tokens.
		startPos := lastNodePos
		for startPos < node.Pos() {
			tokenKind := scan.Token()
			tokenEnd := scan.TokenEnd()
			if tokenKind == kind {
				tokenFullStart := scan.TokenFullStart()
				flags := scan.TokenFlags()
				foundChild = sourceFile.GetOrCreateToken(tokenKind, tokenFullStart, tokenEnd, containingNode, flags)
				return true
			}
			startPos = tokenEnd
			scan.Scan()
		}

		if node.Kind == kind {
			foundChild = node
			return true
		}

		lastNodePos = node.End()
		scan.ResetPos(lastNodePos)
		return false
	}

	ast.ForEachChildAndJSDoc(containingNode, sourceFile, visitNode)

	if foundChild != nil {
		return foundChild
	}

	// Look for child in trailing tokens.
	startPos := lastNodePos
	for startPos < containingNode.End() {
		tokenKind := scan.Token()
		tokenEnd := scan.TokenEnd()
		if tokenKind == kind {
			tokenFullStart := scan.TokenFullStart()
			flags := scan.TokenFlags()
			token := sourceFile.GetOrCreateToken(tokenKind, tokenFullStart, tokenEnd, containingNode, flags)
			return token
		}
		startPos = tokenEnd
		scan.Scan()
	}
	return nil
}

package lint

import (
	"fmt"
	"math/bits"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules"
)

func checkVisitorKind(kind ast.Kind) {
	if kind < 0 || kind >= ast.KindCount {
		panic(fmt.Sprintf("invalid lint visitor node kind: %d", kind))
	}
}

type visitorKinds [(ast.KindCount + 63) / 64]uint64

func selectedKinds(kinds []ast.Kind) (result visitorKinds) {
	if kinds == nil {
		for index := range result {
			result[index] = ^uint64(0)
		}
		return result
	}
	for _, kind := range kinds {
		checkVisitorKind(kind)
		result[kind/64] |= uint64(1) << (kind % 64)
	}
	return result
}

func (kinds *visitorKinds) has(kind ast.Kind) bool {
	return kinds[kind/64]&(uint64(1)<<(kind%64)) != 0
}

func walkSingle(node *ast.Node, visitor rules.Rule) {
	if visitor.Enter == nil && visitor.Exit == nil {
		return
	}
	enterKinds, exitKinds := selectedKinds(visitor.EnterKinds), selectedKinds(visitor.ExitKinds)
	var visit func(*ast.Node)
	visit = func(node *ast.Node) {
		if visitor.Enter != nil && enterKinds.has(node.Kind) && !visitor.Enter(node) {
			return
		}
		node.ForEachChild(func(child *ast.Node) bool {
			visit(child)
			return false
		})
		if visitor.Exit != nil && exitKinds.has(node.Kind) {
			visitor.Exit(node)
		}
	}
	visit(node)
}

func Walk(node *ast.Node, visitors []rules.Rule) {
	if node == nil || len(visitors) == 0 {
		return
	}
	if len(visitors) == 1 {
		walkSingle(node, visitors[0])
		return
	}
	width := (len(visitors) + 63) / 64
	tables := make([]uint64, int(ast.KindCount)*width*2)
	enterKinds, exitKinds := tables[:len(tables)/2], tables[len(tables)/2:]
	masks := make([]uint64, width*3)
	active, commonEnter, commonExit := masks[:width], masks[width:width*2], masks[width*2:]
	enter := make([]func(*ast.Node) bool, len(visitors))
	exit := make([]func(*ast.Node), len(visitors))
	addKinds := func(table []uint64, common []uint64, index int, kinds []ast.Kind) {
		word, bit := index/64, uint64(1)<<(index%64)
		if kinds == nil {
			common[word] |= bit
			return
		}
		for _, kind := range kinds {
			checkVisitorKind(kind)
			table[int(kind)*width+word] |= bit
		}
	}
	for index, visitor := range visitors {
		enter[index], exit[index] = visitor.Enter, visitor.Exit
		if visitor.Enter != nil {
			addKinds(enterKinds, commonEnter, index, visitor.EnterKinds)
		}
		if visitor.Exit != nil {
			addKinds(exitKinds, commonExit, index, visitor.ExitKinds)
		}
		if visitor.Enter != nil && (visitor.EnterKinds == nil || len(visitor.EnterKinds) != 0) ||
			visitor.Exit != nil && (visitor.ExitKinds == nil || len(visitor.ExitKinds) != 0) {
			active[index/64] |= uint64(1) << (index % 64)
		}
	}
	for kind := range int(ast.KindCount) {
		for word := range width {
			enterKinds[kind*width+word] |= commonEnter[word]
			exitKinds[kind*width+word] |= commonExit[word]
		}
	}
	if width == 1 {
		var visit func(*ast.Node, uint64)
		visit = func(node *ast.Node, active uint64) {
			for pending := enterKinds[node.Kind] & active; pending != 0; pending &= pending - 1 {
				index := bits.TrailingZeros64(pending)
				if !enter[index](node) {
					active &^= uint64(1) << index
				}
			}
			if active == 0 {
				return
			}
			node.ForEachChild(func(child *ast.Node) bool {
				visit(child, active)
				return false
			})
			for pending := exitKinds[node.Kind] & active; pending != 0; pending &= pending - 1 {
				exit[bits.TrailingZeros64(pending)](node)
			}
		}
		if active[0] != 0 {
			visit(node, active[0])
		}
		return
	}
	activeCount := 0
	for _, word := range active {
		activeCount += bits.OnesCount64(word)
	}
	var pruned []int
	var visit func(*ast.Node)
	visit = func(node *ast.Node) {
		base := len(pruned)
		offset := int(node.Kind) * width
		for word := range width {
			for pending := enterKinds[offset+word] & active[word]; pending != 0; pending &= pending - 1 {
				index := word*64 + bits.TrailingZeros64(pending)
				if !enter[index](node) {
					active[word] &^= uint64(1) << (index % 64)
					activeCount--
					pruned = append(pruned, index)
				}
			}
		}
		if activeCount != 0 {
			node.ForEachChild(func(child *ast.Node) bool {
				visit(child)
				return false
			})
			for word := range width {
				for pending := exitKinds[offset+word] & active[word]; pending != 0; pending &= pending - 1 {
					exit[word*64+bits.TrailingZeros64(pending)](node)
				}
			}
		}
		for _, index := range pruned[base:] {
			active[index/64] |= uint64(1) << (index % 64)
			activeCount++
		}
		pruned = pruned[:base]
	}
	if activeCount != 0 {
		visit(node)
	}
}

package glob

import (
	"regexp"
	"regexp/syntax"
	"strings"
	"unicode"
)

func (g *Glob) compiled() *syntax.Prog {
	g.programOnce.Do(func() {
		expression, err := syntax.Parse(globExpression(g.elems), syntax.Perl)
		if err != nil {
			panic(err)
		}
		program, err := syntax.Compile(expression.Simplify())
		if err != nil {
			panic(err)
		}
		g.program = program
	})
	return g.program
}

func (g *Glob) CanMatchPrefix(prefix string) bool {
	program := g.compiled()
	closure := func(seeds []uint32) []uint32 {
		var states []uint32
		seen := make(map[uint32]bool)
		var visit func(uint32)
		visit = func(index uint32) {
			if seen[index] {
				return
			}
			seen[index] = true
			instruction := &program.Inst[index]
			switch instruction.Op {
			case syntax.InstAlt, syntax.InstAltMatch:
				visit(instruction.Out)
				visit(instruction.Arg)
			case syntax.InstCapture, syntax.InstNop, syntax.InstEmptyWidth:
				visit(instruction.Out)
			case syntax.InstFail:
				return
			default:
				states = append(states, index)
			}
		}
		for _, seed := range seeds {
			visit(seed)
		}
		return states
	}
	states := closure([]uint32{uint32(program.Start)})
	for _, character := range prefix {
		var next []uint32
		for _, index := range states {
			instruction := &program.Inst[index]
			ranges := instructionRanges(instruction)
			for offset := 0; offset < len(ranges); offset += 2 {
				if character >= ranges[offset] && character <= ranges[offset+1] {
					next = append(next, instruction.Out)
					break
				}
			}
		}
		states = closure(next)
		if len(states) == 0 {
			return false
		}
	}
	return len(states) > 0
}

func (g *Glob) Overlaps(other *Glob) bool {
	left, right := g.compiled(), other.compiled()
	type pair struct{ left, right uint32 }
	pending := []pair{{uint32(left.Start), uint32(right.Start)}}
	seen := make(map[pair]bool)
	for len(pending) > 0 {
		current := pending[len(pending)-1]
		pending = pending[:len(pending)-1]
		if seen[current] {
			continue
		}
		seen[current] = true
		leftInstruction, rightInstruction := &left.Inst[current.left], &right.Inst[current.right]
		if leftInstruction.Op == syntax.InstMatch && rightInstruction.Op == syntax.InstMatch {
			return true
		}
		advance := func(instruction *syntax.Inst, first bool) bool {
			push := func(next uint32) {
				if first {
					pending = append(pending, pair{next, current.right})
				} else {
					pending = append(pending, pair{current.left, next})
				}
			}
			switch instruction.Op {
			case syntax.InstAlt, syntax.InstAltMatch:
				push(instruction.Arg)
				push(instruction.Out)
				return true
			case syntax.InstNop, syntax.InstCapture, syntax.InstEmptyWidth:
				push(instruction.Out)
				return true
			}
			return false
		}
		if advance(leftInstruction, true) || advance(rightInstruction, false) {
			continue
		}
		leftRanges, rightRanges := instructionRanges(leftInstruction), instructionRanges(rightInstruction)
		for leftIndex := 0; leftIndex < len(leftRanges); leftIndex += 2 {
			for rightIndex := 0; rightIndex < len(rightRanges); rightIndex += 2 {
				if max(leftRanges[leftIndex], rightRanges[rightIndex]) <= min(leftRanges[leftIndex+1], rightRanges[rightIndex+1]) {
					pending = append(pending, pair{leftInstruction.Out, rightInstruction.Out})
				}
			}
		}
	}
	return false
}

func instructionRanges(instruction *syntax.Inst) []rune {
	switch instruction.Op {
	case syntax.InstRune, syntax.InstRune1:
		if len(instruction.Rune) == 1 {
			return []rune{instruction.Rune[0], instruction.Rune[0]}
		}
		return instruction.Rune
	case syntax.InstRuneAny:
		return []rune{0, unicode.MaxRune}
	case syntax.InstRuneAnyNotNL:
		return []rune{0, '\n' - 1, '\n' + 1, unicode.MaxRune}
	}
	return nil
}

func globExpression(elements []element) string {
	var result strings.Builder
	for index := 0; index < len(elements); index++ {
		switch value := elements[index].(type) {
		case literal:
			result.WriteString(regexp.QuoteMeta(string(value)))
		case slash:
			result.WriteString("/+")
		case star:
			result.WriteString("[^/]*")
		case starStar:
			if index+1 < len(elements) {
				result.WriteString("(?:[\\s\\S]*/)?")
				index++
			} else {
				result.WriteString("[\\s\\S]*")
			}
		case anyChar:
			result.WriteString("[^/]")
		case charRange:
			result.WriteString("[")
			if value.negate {
				result.WriteString("^/")
			}
			result.WriteString(regexp.QuoteMeta(string(value.low)))
			result.WriteString("-")
			result.WriteString(regexp.QuoteMeta(string(value.high)))
			result.WriteString("]")
		case group:
			result.WriteString("(?:")
			for branch, member := range value {
				if branch > 0 {
					result.WriteString("|")
				}
				result.WriteString(globExpression(member.elems))
			}
			result.WriteString(")")
		}
	}
	return result.String()
}

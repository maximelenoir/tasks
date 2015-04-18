package main

import (
	"unicode"
)

type Trie struct {
	has  bool
	next map[rune]*Trie
}

func (t *Trie) Add(s string) {
	for _, r := range s {
		if t.next == nil {
			t.next = make(map[rune]*Trie)
		}
		r = unicode.ToLower(r)

		n, ok := t.next[r]
		if !ok {
			n = &Trie{}
			t.next[r] = n
		}
		t = n
	}
	t.has = true
}

func (t *Trie) get(s string) *Trie {
	if t == nil {
		return nil
	}
	for _, r := range s {
		if t.next == nil {
			return nil
		}
		r = unicode.ToLower(r)
		if n, ok := t.next[r]; !ok {
			return nil
		} else {
			t = n
		}
	}
	return t
}

func (t *Trie) Has(s string) bool {
	if f := t.get(s); f != nil {
		return f.has
	}
	return false
}

func (t *Trie) HasPrefix(s string) bool {
	return t.get(s) != nil
}

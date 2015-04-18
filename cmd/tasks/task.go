package main

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
	"unicode"
)

type Task struct {
	Id          string    `json:"id"`
	CreatedOn   time.Time `json:"createdOn"`
	CompletedOn time.Time `json:"completedOn,omitempty"`
	UpdatedOn   time.Time `json:"updatedOn,omitempty"`
	AlarmOn     time.Time `json:"alarmOn,omitempty"`
	Pinned      bool      `json:"pinned"`
	Name        string    `json:"name"`
	Done        bool      `json:"done"`
	Details     string    `json:"details"`
	Links       []Link    `json:"links"`
	content     *Trie
}

type Link struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Href string `json:"href"`
}

func (t Task) Link(name string) (Link, bool) {
	for _, link := range t.Links {
		if link.Name == name {
			return link, true
		}
	}
	return Link{}, false
}

func (t *Task) Update() {
	t.content = &Trie{}
	for _, indexed := range []string{t.Name, t.Details} {
		for _, chunk := range strings.FieldsFunc(indexed, func(r rune) bool {
			return unicode.IsPunct(r) || unicode.IsSpace(r)
		}) {
			t.content.Add(chunk)
		}
	}
}

func (t Task) Match(terms []string) bool {
	for _, term := range terms {
		if !t.content.HasPrefix(term) {
			return false
		}
	}
	return true
}

type Tasks struct {
	Tasks map[string]Task
	m     sync.RWMutex
}

func (t Tasks) Get(id string) (Task, bool) {
	t.m.RLock()
	task, ok := t.Tasks[id]
	t.m.RUnlock()
	return task, ok
}

func (t Tasks) Set(task Task) {
	t.m.Lock()
	t.Tasks[task.Id] = task
	t.m.Unlock()
}

func (t Tasks) Delete(task Task) {
	t.m.Lock()
	delete(t.Tasks, task.Id)
	t.m.Unlock()
}

func (t Tasks) Save() {
	filename := filepath.Join(dataRootDir, tasksFilename)

	f, err := os.Create(filename)
	if err != nil {
		log.Printf("could not save tasks: %s\n", err)
		return
	}
	t.m.RLock()
	defer t.m.RUnlock()
	json.NewEncoder(f).Encode(t.Slice())
	if err := f.Close(); err != nil {
		log.Println("could not encode tasks: %s\n", err)
		return
	}

	log.Printf("tasks saved under %s\n", filename)
}

func (t Tasks) Load() {
	if err := os.MkdirAll(dataRootDir, 0755); err != nil {
		log.Printf("could not create data dir: %s\n", err)
		return
	}
	filename := filepath.Join(dataRootDir, tasksFilename)

	f, err := os.Open(filename)
	if err != nil {
		log.Printf("could not load tasks: %s\n", err)
		return
	}
	defer f.Close()
	t.m.Lock()
	defer t.m.Unlock()
	var tasks []Task
	if err := json.NewDecoder(f).Decode(&tasks); err != nil {
		log.Printf("could not decode tasks: %s\n", err)
		return
	}

	for _, task := range tasks {
		task.Update()
		t.Tasks[task.Id] = task
	}

	log.Printf("tasks loaded from %s\n", filename)
}

func (t Tasks) Slice() []Task {
	t.m.RLock()
	defer t.m.RUnlock()
	tasks := make([]Task, 0, len(t.Tasks))
	for _, task := range t.Tasks {
		tasks = append(tasks, task)
	}
	return tasks
}

func (t Tasks) Search(terms []string) []Task {
	var matches []Task
	for _, task := range t.Tasks {
		if task.Match(terms) {
			matches = append(matches, task)
		}
	}
	return matches
}

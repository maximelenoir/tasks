package main

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
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

package main

import (
	"crypto/sha1"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/gorilla/mux"
	"io"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"time"
)

var (
	dataRootDir   string
	addr          string
	https         bool
	tlsCert       string
	tlsKey        string
	tasksFilename = "tasks.json"
)

func init() {
	flag.StringVar(&dataRootDir, "data-dir", "data", "Data root directory")
	flag.StringVar(&addr, "addr", ":80", "Listening address")
	flag.BoolVar(&https, "https", false, "Enable HTTPS")
	flag.StringVar(&tlsCert, "tsl-cert", "etc/server.crt", "TLS certificate")
	flag.StringVar(&tlsKey, "tsl-key", "etc/server.key", "TLS private key")
}

func main() {
	flag.Parse()

	tasks := Tasks{
		Tasks: make(map[string]Task),
	}
	tasks.Load()
	defer tasks.Save()

	LoadUsers()

	r := mux.NewRouter()
	r.HandleFunc("/", logReq(ensureLoggedIn(htmlIndex)))
	r.HandleFunc("/login", logReq(htmlLogin))
	r.HandleFunc("/new", logReq(ensureLoggedIn(hookTasks(tasks, jsonNewTask))))
	r.HandleFunc("/tasks", logReq(ensureLoggedIn(hookTasks(tasks, jsonTasks))))
	r.HandleFunc("/search", logReq(ensureLoggedIn(hookTasks(tasks, jsonSearch))))
	r.HandleFunc("/save/{id}", logReq(ensureLoggedIn(hookTasks(tasks, jsonSave))))
	r.HandleFunc("/delete/{id}", logReq(ensureLoggedIn(hookTasks(tasks, jsonDelete))))
	r.HandleFunc("/link/{id}", logReq(ensureLoggedIn(hookTasks(tasks, jsonLink))))
	r.HandleFunc("/unlink/{id}/{link}", logReq(ensureLoggedIn(hookTasks(tasks, jsonUnlink))))
	r.HandleFunc("/file/{id}/{link}", logReq(ensureLoggedIn(hookTasks(tasks, jsonFile))))
	r.PathPrefix("/rsc").Handler(http.StripPrefix("/", http.FileServer(http.Dir("."))))

	srv := http.Server{
		Addr:    addr,
		Handler: r,
	}
	var err error
	if https {
		err = srv.ListenAndServeTLS(tlsCert, tlsKey)
	} else {
		err = srv.ListenAndServe()
	}
	log.Println(err)
}

func sendErr(w http.ResponseWriter, status int, err error) {
	type Error struct {
		Err string `json:"error"`
	}

	w.WriteHeader(status)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Error{Err: err.Error()})
}

type handlerTask func(w http.ResponseWriter, req *http.Request, task Task)
type handlerTasks func(w http.ResponseWriter, req *http.Request, tasks Tasks)

func logReq(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		t := time.Now()
		h(w, req)
		log.Println(req.Host, req.URL.Path, time.Since(t))
	}
}

func hookTasks(tasks Tasks, h handlerTasks) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		h(w, req, tasks)
	}
}

func ensureLoggedIn(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		token, err := req.Cookie("token")
		if err != nil || !Accept(token.Value) {
			http.Redirect(w, req, "/login", http.StatusTemporaryRedirect)
			return
		}
		h(w, req)
	}
}

func htmlIndex(w http.ResponseWriter, req *http.Request) {
	http.ServeFile(w, req, "rsc/app/index.html")
}

func htmlLogin(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		sendErr(w, http.StatusInternalServerError, err)
		return
	}

	user := req.Form.Get("user")
	pwd := req.Form.Get("password")
	u, ok := Connect(user, pwd)
	if !ok {
		http.ServeFile(w, req, "rsc/app/login.html")
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:    "token",
		Value:   u.Token,
		Expires: u.Until,
		Path:    "/",
	})
	http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
}

func jsonNewTask(w http.ResponseWriter, req *http.Request, tasks Tasks) {
	var id string
	for {
		t, _ := time.Now().MarshalBinary()
		h := sha1.Sum(t)
		id = fmt.Sprintf("%X", h[:])
		if _, exists := tasks.Get(id); !exists {
			break
		}
	}

	now := time.Now()
	task := Task{
		Id:        id,
		CreatedOn: now,
		UpdatedOn: now,
		Details:   "No description",
	}
	tasks.Set(task)
	if err := json.NewEncoder(w).Encode(task); err != nil {
		sendErr(w, http.StatusInternalServerError, err)
	}
}

func jsonTasks(w http.ResponseWriter, req *http.Request, tasks Tasks) {
	json.NewEncoder(w).Encode(tasks.Slice())
}

func jsonSearch(w http.ResponseWriter, req *http.Request, tasks Tasks) {
	var terms []string
	if err := json.NewDecoder(req.Body).Decode(&terms); err != nil {
		sendErr(w, http.StatusBadRequest, err)
		return
	}

	matches := tasks.Search(terms)

	if err := json.NewEncoder(w).Encode(matches); err != nil {
		sendErr(w, http.StatusInternalServerError, err)
	}
}

func jsonSave(w http.ResponseWriter, req *http.Request, tasks Tasks) {
	id, ok := mux.Vars(req)["id"]
	if !ok {
		sendErr(w, http.StatusBadRequest, fmt.Errorf("no id specified"))
		return
	}
	task, ok := tasks.Get(id)
	if !ok {
		sendErr(w, http.StatusNotFound, fmt.Errorf("cannot find task with id %q", id))
		return
	}

	orig := task
	err := json.NewDecoder(req.Body).Decode(&task)
	if err != nil {
		sendErr(w, http.StatusInternalServerError, err)
		return
	}

	if orig.Id != task.Id {
		sendErr(w, http.StatusBadRequest, fmt.Errorf("mismatch between ids %q and %q", orig.Id, task.Id))
		return
	}

	task.Update()
	tasks.Set(task)
	tasks.Save()
}

func jsonDelete(w http.ResponseWriter, req *http.Request, tasks Tasks) {
	id, ok := mux.Vars(req)["id"]
	if !ok {
		sendErr(w, http.StatusBadRequest, fmt.Errorf("no id specified"))
		return
	}
	task, ok := tasks.Get(id)
	if !ok {
		sendErr(w, http.StatusNotFound, fmt.Errorf("cannot find task with id %q", id))
		return
	}

	// TODO: delete links on disk

	tasks.Delete(task)
	tasks.Save()
}

func jsonLink(w http.ResponseWriter, req *http.Request, tasks Tasks) {
	id, ok := mux.Vars(req)["id"]
	if !ok {
		sendErr(w, http.StatusBadRequest, fmt.Errorf("no id specified"))
		return
	}
	task, ok := tasks.Get(id)
	if !ok {
		sendErr(w, http.StatusNotFound, fmt.Errorf("cannot find task with id %q", id))
		return
	}

	if err := req.ParseMultipartForm(100 * 1024 * 1024); err != nil {
		sendErr(w, http.StatusInternalServerError, err)
		return
	}

	for name, hdrs := range req.MultipartForm.File {
		if len(hdrs) != 1 {
			sendErr(w, http.StatusBadRequest, fmt.Errorf("multiple files for name %q", name))
			return
		}
		hdr := hdrs[0]
		f, err := hdr.Open()
		if err != nil {
			sendErr(w, http.StatusBadRequest, err)
			return
		}
		defer f.Close()

		if err := os.MkdirAll(filepath.Join("data", task.Id), 0755); err != nil {
			sendErr(w, http.StatusInternalServerError, err)
			return
		}

		// Save the file in data/{id}/{name}
		out, err := os.Create(filepath.Join("data", task.Id, name))
		if err != nil {
			sendErr(w, http.StatusInternalServerError, err)
			return
		}
		if _, err := io.Copy(out, f); err != nil {
			sendErr(w, http.StatusInternalServerError, err)
			return
		}
		if err := out.Close(); err != nil {
			sendErr(w, http.StatusInternalServerError, err)
			return
		}

		link := Link{
			Name: name,
			Type: hdr.Header.Get("Content-Type"),
			Href: path.Join("/file", task.Id, name),
		}
		task.Links = append(task.Links, link)
	}

	tasks.Set(task)
	tasks.Save()

	if err := json.NewEncoder(w).Encode(task); err != nil {
		sendErr(w, http.StatusInternalServerError, err)
	}
}
func jsonUnlink(w http.ResponseWriter, req *http.Request, tasks Tasks) {
	id, ok := mux.Vars(req)["id"]
	if !ok {
		sendErr(w, http.StatusBadRequest, fmt.Errorf("no id specified"))
		return
	}
	task, ok := tasks.Get(id)
	if !ok {
		sendErr(w, http.StatusNotFound, fmt.Errorf("cannot find task with id %q", id))
		return
	}
	linkname, ok := mux.Vars(req)["link"]
	if !ok {
		sendErr(w, http.StatusBadRequest, fmt.Errorf("no link specified"))
		return
	}
	if _, ok := task.Link(linkname); !ok {
		sendErr(w, http.StatusNotFound, fmt.Errorf("cannot find link with name %q", linkname))
		return
	}

	if err := os.Remove(filepath.Join("data", id, linkname)); err != nil {
		sendErr(w, http.StatusInternalServerError, err)
		return
	}
	for l, link := range task.Links {
		if link.Name == linkname {
			copy(task.Links[l:], task.Links[l+1:])
			task.Links = task.Links[:len(task.Links)-1]
			break
		}
	}

	tasks.Set(task)
	tasks.Save()

	if err := json.NewEncoder(w).Encode(task); err != nil {
		sendErr(w, http.StatusInternalServerError, err)
	}
}

func jsonFile(w http.ResponseWriter, req *http.Request, tasks Tasks) {
	id, ok := mux.Vars(req)["id"]
	if !ok {
		sendErr(w, http.StatusBadRequest, fmt.Errorf("no id specified"))
		return
	}
	task, ok := tasks.Get(id)
	if !ok {
		sendErr(w, http.StatusNotFound, fmt.Errorf("cannot find task with id %q", id))
		return
	}
	linkname, ok := mux.Vars(req)["link"]
	if !ok {
		sendErr(w, http.StatusBadRequest, fmt.Errorf("no link specified"))
		return
	}
	link, ok := task.Link(linkname)
	if !ok {
		sendErr(w, http.StatusNotFound, fmt.Errorf("cannot find link with name %q", linkname))
		return
	}

	f, err := os.Open(filepath.Join("data", task.Id, link.Name))
	if err != nil {
		sendErr(w, http.StatusInternalServerError, err)
		return
	}
	defer f.Close()
	w.Header().Set("Content-Type", link.Type)
	if _, err := io.Copy(w, f); err != nil {
		sendErr(w, http.StatusInternalServerError, err)
		return
	}
}

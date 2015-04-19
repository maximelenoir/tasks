package main

import (
	"crypto/sha1"
	"encoding/csv"
	"flag"
	"fmt"
	"log"
	"os"
	"time"
)

var (
	nouser bool
	users  map[string]*User  // Name => User
	logged map[string]string // Tokens => Name
	userdb string
)

func init() {
	flag.BoolVar(&nouser, "no-user", false, "Disable user log-in")
	flag.StringVar(&userdb, "userdb", "data/users.db", "User database")
}

type User struct {
	Name  string
	Pwd   string
	Token string
	Until time.Time
}

func LoadUsers() {
	f, err := os.Open(userdb)
	if err != nil {
		log.Printf("cannot open userdb: %s\n", err)
		return
	}
	defer f.Close()
	recs, err := csv.NewReader(f).ReadAll()
	if err != nil {
		log.Printf("cannot read userdb: %s\n", err)
		return
	}

	users = make(map[string]*User)
	for _, rec := range recs {
		user := &User{
			Name: rec[0],
			Pwd:  rec[1],
		}
		users[user.Name] = user
	}
	logged = make(map[string]string)
}

func Accept(token string) bool {
	if nouser {
		return true
	}
	name, ok := logged[token]
	if !ok {
		return false
	}
	user, ok := users[name]
	return ok && user.Until.After(time.Now())
}

func Connect(user, password string) (*User, bool) {
	if user == "" || password == "" {
		return nil, false
	}

	hPwd := fmt.Sprintf("%x", sha1.Sum([]byte(password)))
	u, ok := users[user]
	if !ok {
		return nil, false
	}
	if u.Pwd != hPwd {
		return nil, false
	}

	t := fmt.Sprintf("00%X00%X00", user, time.Now().String())
	h := sha1.Sum([]byte(t))
	token := fmt.Sprintf("%x", h)
	u.Until = time.Now().AddDate(0, 1, 0)
	u.Token = token
	logged[token] = u.Name
	return u, true
}

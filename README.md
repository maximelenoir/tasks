# tasks

### Overview
`tasks` helps you organize and remember your daily tasks.

### Dependencies
* golang (http://golang.org/doc/install)

### Install
```bash
$ cd $GOPATH/src
$ git clone https://github.com/maximelenoir/tasks
$ cd tasks
$ go get ./cmd/tasks
$ go build ./cmd/tasks
```

### Play
```bash
$ ./adduser.sh
$ ./tasks -addr=:8080 -data-dir=/path/to/data 
```

package main

import (
	"blogserver/arti"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
)

func main() {
	http.Handle("/res/", http.StripPrefix("/res", http.FileServer(http.Dir("./homepage"))))
	http.Handle("/img/", http.StripPrefix("/img", http.FileServer(http.Dir("../datavi/img"))))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./homepage/home.html")
	})
	http.HandleFunc("/text", textHandler)
	http.HandleFunc("/article", articleHandler)
	addr := "127.0.0.1:1721"
	fmt.Println("PID is", os.Getpid())
	fmt.Println("Server Running at", addr)
	err := http.ListenAndServe(addr, nil)
	if err != nil {
		fmt.Println("Error:( ", err)
	}
}

func textHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		idstr := r.URL.Query().Get("nth")
		id, err := strconv.Atoi(idstr)
		if idstr == "" || err != nil {
			http.Error(w, "Invalid GET Format", http.StatusBadRequest)
			return
		}
		data := arti.TextGet(id)
		w.Header().Set("Content-Type", "application/json")
		if data != nil {
			w.Write(data)
		} else {
			end := []byte("{\"End\":true}")
			w.Write(end)
		}
	case http.MethodPost:
		typ := r.FormValue("type")
		txt := r.FormValue("text")
		if typ == "" || txt == "" {
			http.Error(w, "Invalid POST Format", http.StatusBadRequest)
			return
		}
		txt = strings.ReplaceAll(txt, "\r\n", "\n")
		switch typ {
		case "create":
			if !arti.TextCheckFormat(txt) {
				http.Error(w, "Invalid text Format", http.StatusBadRequest)
				return
			}
			arti.TextUpload(txt)
		case "create_withimg":
			if !arti.TextCheckFormat(txt) {
				http.Error(w, "Invalid text Format", http.StatusBadRequest)
				return
			}
			img, imgH, err := r.FormFile("image")
			if err != nil {
				http.Error(w, "Invalid POST Format", http.StatusBadRequest)
				return
			}
			arti.TextUploadImage(txt, img, imgH.Filename)
		case "edit":
			index := r.FormValue("index")
			if index == "" {
				http.Error(w, "Invalid POST Format", http.StatusBadRequest)
				return
			}
			arti.TextEdit(index, txt)
		}
	case http.MethodDelete:
		index := r.URL.Query().Get("index")
		if index == "" {
			http.Error(w, "Invalid DELETE Format", http.StatusBadRequest)
			return
		}
		arti.TextDelete(index)
	}
}

func articleHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		l := r.URL.Query().Get("list")
		if l == "true" {
			w.Header().Set("Content-Type", "application/json")
			w.Write(arti.ArticleGetList())
			return
		}
		idstr := r.URL.Query().Get("id")
		id, err := strconv.Atoi(idstr)
		if err != nil || id == 0 {
			http.Error(w, "Invalid GET Format", http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(arti.ArticleGet(id))
	case http.MethodPost:
		err := arti.ArticleUpload(r)
		if err != nil {
			http.Error(w, "Invalid POST Format", http.StatusBadRequest)
			return
		}
	case http.MethodDelete:
		idstr := r.URL.Query().Get("id")
		id, err := strconv.Atoi(idstr)
		if err != nil {
			http.Error(w, "Invalid DELETE Format", http.StatusBadRequest)
			return
		}
		arti.ArtileDelete(id)
	}
}

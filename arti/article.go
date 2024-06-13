package arti

import (
	"net/http"
)

type article struct {
	Id      int
	Title   string
	Time    string
	Content string
}

const (
	ARTICLE_DIR string = "../datavi/article/"
)

func ArticleGetList() []byte {
	return nil
}

func ArticleGet(id int) []byte {
	return nil
}

func ArticleUpload(r *http.Request) error {
	return nil
}

func ArtileDelete(id int) {}

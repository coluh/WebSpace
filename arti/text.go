package arti

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"time"
)

type text struct {
	Image   string
	Tag     string
	Content string
	Time    string
}

const (
	TEXT_DIR string = "../datavi/text/"
	IMG_DIR  string = "../datavi/img/"
)

// 按文件名升序排列的
var textList []string

func checkTextList() {
	if textList == nil {
		textList = []string{}
		dire, _ := os.ReadDir(TEXT_DIR)
		for _, file := range dire {
			if len(file.Name()) == 13 {
				textList = append(textList, file.Name())
			}
		}
	}
}

func TextGet(id int) []byte {
	checkTextList()
	n := len(textList)
	if id >= n || id < 0 {
		return nil
	}
	filename := textList[n-1-id]
	f, _ := os.ReadFile(TEXT_DIR + filename)
	var data text
	pipe := bytes.IndexByte(f, '|')
	if pipe != 0 {
		data.Image = filename + string(f[0:pipe])
	}
	newl := bytes.IndexByte(f, '\n')
	data.Tag = string(f[pipe+1 : newl])
	data.Content = string(f[newl+1:])
	data.Time = filename
	ret, _ := json.Marshal(data)
	return ret
}

func TextCheckFormat(data string) bool {
	f := []byte(data)
	// File Format:
	// [filename]|<tag>
	pipe := bytes.IndexByte(f, '|')
	newl := bytes.IndexByte(f, '\n')
	if pipe == -1 || newl == -1 {
		return false
	}
	if pipe > newl {
		return false
	}
	return true
}

func TextUpload(data string) {
	checkTextList()
	filename := fmt.Sprintf("%d", time.Now().UnixMilli())
	// if two post reached in less than 1 milisecond, the former one will just disappear
	f, _ := os.Create(TEXT_DIR + filename)
	log.Println("Create text", filename)
	f.WriteString(data)
	f.Close()
	textList = append(textList, filename)
}

func TextEdit(index string, data string) {
	checkTextList()
	origin, _ := os.ReadFile(TEXT_DIR + index)
	newl := bytes.IndexByte(origin, '\n')
	head := string(origin[:newl+1])
	after, _ := os.OpenFile(TEXT_DIR+index, os.O_WRONLY|os.O_TRUNC, 0644)
	defer after.Close()
	_, _ = after.WriteString(head + data)
	log.Println("Edit text", index)
}

func TextUploadImage(data string, img multipart.File, imgname string) {
	checkTextList()
	filename := fmt.Sprintf("%d", time.Now().UnixMilli())
	f, _ := os.Create(TEXT_DIR + filename)
	log.Println("Create text", filename)
	f.WriteString(imgname)
	f.WriteString(data)
	f.Close()
	textList = append(textList, filename)
	f, _ = os.Create(IMG_DIR + filename + string(imgname))
	log.Println("Add", imgname)
	_, _ = io.Copy(f, img)
	f.Close()
}

func TextDelete(index string) {
	os.Remove(TEXT_DIR + index)
	log.Println("Delete", index)
	textList = nil
}

show_main("text", document.getElementById("textPageButton"));

function show_main(id, li) {
    document.querySelectorAll("main").forEach((page) => {
        page.style.display = "none";
    });
    document.getElementById(id).style.display = "block";
    if (id == "text") {
        get_text(10);
    }
    document.querySelectorAll("header li").forEach((btn) => {
        btn.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    });
    if (li != null) {
        li.style.backgroundColor = "white";
    }
}

function clear_cache() {
    location.reload(true);
}

function effect(ele) {
    ele.style.transition = "background-color 0.08s ease";
    ele.style.backgroundColor = "#cccccc";
    setTimeout(() => {
        ele.style.transition = "background-color 0.3s ease";
        ele.style.backgroundColor = "#eeeeee";
    }, 100);
}

let IsReadyToUploadText = false;

function cancelTextUpload() {
    IsReadyToUploadText = false;
    let bl = document.getElementById("text_left");
    let area = document.getElementById("text_upload");
    bl.style.opacity = "0";

    area.style.opacity = "0";
    area.style.height = "0";
    setTimeout(() => {
        area.style.display = "none";
    }, 300);
}

document.getElementById("text_left").addEventListener("click", function () {
    let bl = document.getElementById("text_left");
    let br = document.getElementById("text_right");
    effect(bl);
    if (IsReadyToUploadText) {
        cancelTextUpload();
        br.innerText = "发一条";
    }
});

document.getElementById("text_right").addEventListener("click", function () {
    let bl = document.getElementById("text_left");
    let br = document.getElementById("text_right");
    effect(br);
    let area = document.getElementById("text_upload");
    if (!IsReadyToUploadText) {
        IsReadyToUploadText = true;
        bl.style.opacity = "1";
        br.innerText = "上传";

        area.style.display = "block";
        let textuploadHeight = area.scrollHeight;
        area.style.height = "0";
        setTimeout(() => {
            area.style.opacity = "1";
            area.style.height = textuploadHeight + "px";
        }, 0);
    } else {
        uploadText(br);
    }
});

function text_add_tag(tagname) {
    let l = document.querySelector(".text_taglist");
    let cs = l.children;
    for (let i = 0; i < cs.length; i++) {
        if (cs[i].innerText == tagname) {
            return;
        }
    }
    let c = cs[0];
    let n = c.cloneNode(true);
    n.innerText = tagname;
    l.appendChild(n);
}

function text_choose_tag(btn) {
    effect(btn);
    document.getElementById("text_tag").value = btn.innerText;
}

document.getElementById("text_image").addEventListener("change", function (event) {
    let file = event.target.files[0];
    let imgin = document.getElementById("text_image_preview");
    if (file) {
        imgin.src = URL.createObjectURL(file);
    } else {
        imgin.src = "/res/upload.png";
    }
});

function get_text(n) {
    if (n == 0) {
        return;
    }
    let p = document.getElementById("text");
    let index = document.querySelectorAll(".text_node").length;
    if (n == -1) {
        // this means get the latest text
        index = 0;
    }
    fetch("/text?nth=" + index)
        .then((response) => response.json())
        .then((data) => {
            if (data.End == true) {
                document.getElementById("text_load").innerText = "没有更多了";
                return;
            }
            let template = document.querySelector(".text_temp");
            let newnode = template.cloneNode(true);
            newnode.classList.remove("text_temp");
            newnode.classList.add("text_node");
            newnode.querySelector(".tag").innerText = data.Tag;
            text_add_tag(data.Tag);
            let passage = data.Content;
            // Markdown
            passage = passage.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            passage = passage.replace(/__(.*?)__/g, "<em>$1</em>");
            passage = passage.replace(/^>\s(.*?)$\n/gm, "<blockquote>$1</blockquote>");
            passage = passage.replace(/\n/g, "<br/>");
            // passage = passage.replace(/\n\n/g, "<br/>");
            newnode.querySelector(".content").innerHTML = passage;
            if (data.Image == "") {
                newnode.querySelector(".image").remove();
            } else {
                newnode.querySelector(".image").src = "/img/" + data.Image;
            }
            newnode.setAttribute("data-index", data.Time);
            newnode.querySelector(".time").innerText = timems2time(data.Time);
            newnode.addEventListener("click", text_clicked);
            if (n == -1) {
                let firstnode = document.querySelector(".text_node");
                document.getElementById("text").insertBefore(newnode, firstnode);
                newnode.classList.add("moveOutX");
                setTimeout(() => {
                    newnode.classList.remove("moveOutX");
                }, 20);
                return;
            }
            let loadnode = document.getElementById("text_load");
            p.insertBefore(newnode, loadnode);
            newnode.classList.add("moveOutY");
            setTimeout(() => {
                newnode.classList.remove("moveOutY");
            }, 20);
            get_text(n - 1);
            light_tag(null);
        });
}

function uploadText(b) {
    // upload!!!
    let content = document.getElementById("text_content");
    let tag = document.getElementById("text_tag");
    if (content.value == "" || tag.value == "") {
        return;
    }
    let message = "|" + tag.value + "\n" + content.value;

    let formdata = new FormData();
    formdata.append("text", message);
    let imgFile = document.getElementById("text_image").files[0];
    if (imgFile) {
        formdata.append("type", "create_withimg");
        formdata.append("image", imgFile);
    } else {
        formdata.append("type", "create");
    }
    fetch("/text", {
        method: "POST",
        body: formdata,
    })
        .then((response) => {
            if (!response.ok) {
                b.innerText = "fail";
                throw new Error("fetch POST failed when upload text");
            }
        })
        .then(() => {
            b.innerText = "上传成功";
            content.value = "";
            tag.value = "";
            document.getElementById("text_image_preview").src = "/res/upload.png";
            cancelTextUpload();
            setTimeout(() => {
                if (!IsReadyToUploadText) {
                    b.innerText = "发一条";
                }
            }, 1000);

            get_text(-1);
        });
}

function timems2time(timems) {
    let t = new Date(parseInt(timems));
    let Y = t.getFullYear();
    let M = t.getMonth() + 1;
    let D = t.getDate();
    let h = String(t.getHours()).padStart(2, "0");
    let m = String(t.getMinutes()).padStart(2, "0");
    let s = String(t.getSeconds()).padStart(2, "0");
    return Y + "-" + M + "-" + D + " " + h + ":" + m + ":" + s;
}

let currentHighTag = "";

window.addEventListener("scroll", function () {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        if (document.getElementById("text").style.display == "block") {
            setTimeout(() => {
                get_text(5);
            }, 100);
        }
    }
});

function light_tag(ele) {
    if (ele != null) {
        effect(ele);
        if (currentHighTag != "") {
            currentHighTag = "";
        } else {
            currentHighTag = ele.innerText;
        }
    }

    let nodes = document.querySelectorAll(".text_node");
    if (currentHighTag == "") {
        nodes.forEach(function (node) {
            node.style.color = "black";
        });
        return;
    }
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].querySelector(".tag").innerText != currentHighTag) {
            nodes[i].style.color = "#bbbbbb";
        }
    }
}

function text_show_options(btn) {
    effect(btn);
    btn.parentNode.querySelector(".options").style.display = "flex";
    setTimeout(() => {
        btn.parentNode.querySelector(".options").style.opacity = "1";
    }, 0);
}

function text_options_cancel(btn) {
    effect(btn);
    btn.parentNode.style.opacity = "0";
    setTimeout(() => {
        btn.parentNode.style.display = "none";
    }, 300);
}

function text_options_discard(btn) {
    text_options_cancel(btn);
    let dad = btn.parentNode.parentNode;
    let pEle = dad.querySelector(".content");
    if (pEle.style.display == "none") {
        pEle.style.display = "block";
        dad.querySelector(".content_edit").remove();
        dad.querySelector(".options .edit").innerText = "编辑";
    }
}

function text_clicked(event) {
    if (
        !event.target.closest(".text_node .tag") &&
        !event.target.closest(".text_node .options") &&
        !event.target.closest(".text_node .image")
    ) {
        let nodes = document.querySelectorAll(".text_node");
        nodes.forEach(function (node) {
            if (event.target.closest(".text_node .moreopt") && node == event.currentTarget) {
                return;
            }
            text_options_cancel(node.querySelector(".options .cancel"));
        });
    }
}

function text_options_edit(btn) {
    let dad = btn.parentNode.parentNode;
    let pEle = dad.querySelector(".content");
    let pnext = pEle.nextElementSibling;
    if (btn.innerText == "编辑") {
        btn.innerText = "提交";
        let editEle = document.createElement("textarea");
        editEle.value = pEle.innerText;
        editEle.classList.add("content_edit");
        editEle.style.height = pEle.offsetHeight + "px";
        editEle.addEventListener("input", function () {
            this.style.height = "auto";
            this.style.height = this.scrollHeight + 2 + "px";
        });

        pEle.style.display = "none";
        dad.insertBefore(editEle, pnext);
    } else if (btn.innerText == "提交") {
        btn.innerText = "编辑";
        let editEle = dad.querySelector(".content_edit");
        pEle.innerText = editEle.value;
        let formdata = new FormData();
        formdata.append("type", "edit");
        formdata.append("index", dad.getAttribute("data-index"));
        formdata.append("text", editEle.value);
        fetch("/text", {
            method: "POST",
            body: formdata,
        }).then((response) => {
            if (!response.ok) {
                throw new Error("fetch POST failed when edit text");
            }
        });

        editEle.remove();
        pEle.style.display = "block";
    }
    text_options_cancel(btn);
}
function text_options_delete(btn) {
    let dad = btn.parentNode.parentNode;
    let index = dad.getAttribute("data-index");
    fetch("/text?index=" + index, {
        method: "DELETE",
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("fetch DELETE failed when delete text");
            }
        })
        .then(() => {
            dad.remove();
        });
    text_options_cancel(btn);
}

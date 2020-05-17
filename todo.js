const columnNames = ["todo1", "todo2", "doing1", "doing2", "done1", "done2"];
const url = "https://api.jsonbin.io/b/5ec060bfa47fdd6af16466bf";
const code = "$2b$10$6EGg8be16ZnNFSfN9myQAOI9xOmhqcxb6OCQrgYZ4YBRMYjEVQkD6";

function syncUp() {
  eject();
  let req = new XMLHttpRequest();

  req.onreadystatechange = () => {
    try {
      if (req.readyState == XMLHttpRequest.DONE) {
        console.log(req.responseText);
      }
    } catch (error) {
      console.log("getVersions", error);
    }
  };

  const data = Object.keys(localStorage).map((key) => ({
    key: key,
    data: localStorage.getItem(key),
  }));

  req.open("PUT", url, true);
  req.setRequestHeader("Content-Type", "application/json");
  req.setRequestHeader("secret-key", code);
  req.send(JSON.stringify(data));
}

function syncDown(version = "latest") {
  localStorage.clear();
  let req = new XMLHttpRequest();

  req.onreadystatechange = () => {
    try {
      if (req.readyState == XMLHttpRequest.DONE) {
        JSON.parse(req.responseText).forEach((item) => {
          localStorage.setItem(item.key, item.data);
        });
        inject(version);
      }
    } catch (error) {
      console.log("getVersions", error);
    }
  };

  req.open("GET", `${url}/${version}`, true);
  req.setRequestHeader("secret-key", code);
  req.send();
}

function getVersions(version) {
  let req = new XMLHttpRequest();

  req.onreadystatechange = () => {
    try {
      if (req.readyState == XMLHttpRequest.DONE) {
        console.log(req.responseText);
        const data = JSON.parse(req.responseText);
        const history = data.binVersions.splice(0, 10);

        //created version

        select = document.getElementById("versions");
        select.options.length = 1; //clear old version dropdown
        /*history.forEach((item) => {
          const option = document.createElement("option");
          option.text = new Date(item.created).toLocaleString("es", {
            timeZone: "UTC",
          });
          option.value = item.version;
          select.add(option);
        });*/
        select.selectedIndex = Array.from(select.options).findIndex(
          (item) => item.value == version
        );
      }
    } catch (error) {
      console.log("getVersions", error);
    }
  };

  req.open("GET", `${url.replace("/b/", "/e/")}/versions`, true);
  req.setRequestHeader("secret-key", code);
  req.send();
}
function inject(version = "latest") {
  columnNames.forEach((columnName) => {
    try {
      const node = document.getElementById(columnName);
      while (node.lastElementChild) {
        node.removeChild(node.lastElementChild);
      }
      const data = JSON.parse(localStorage.getItem(columnName));
      //convert JSON data to HTML DOMNodes
      data.forEach((item) => {
        newCard(columnName, item.id, item.description, item.color, item.title);
      });
    } catch (error) {
      console.log("inject", error);
    }
  });
  getVersions(version);
}
function eject() {
  columnNames.forEach((columnName) => {
    try {
      //find each column (todo1...done2)
      const list = Array.from(document.getElementById(columnName).childNodes);
      //convert HTML DOMNodes to JSON data
      const data = list.map((item) => ({
        id: item.id.substring(5),
        title: item.getElementsByTagName("input")[0].value,
        description: item.getElementsByTagName("p")[0].textContent,
        color: item.style.backgroundColor,
      }));
      localStorage.setItem(columnName, JSON.stringify(data));
    } catch (error) {
      console.log("eject", error);
    }
  });
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  ev.target.appendChild(document.getElementById(data));
}

function changeColor(item, color) {
  event.preventDefault();
  item.closest(".drag").style.backgroundColor = color;
}
function remove(item) {
  event.preventDefault();
  if (
    item.closest("#todo, #doing, #done").id != "done" &&
    !window.confirm("Are you sure?")
  ) {
    return;
  }
  item.parentElement.parentElement.remove();
}

function selectContent(item) {
  var range = document.createRange();
  range.selectNodeContents(item);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function newCard(
  column = "todo1",
  id = uuidv4(),
  description = "Description...",
  color = "#90ee90",
  title = ""
) {
  document.getElementById(column).insertAdjacentHTML(
    "afterbegin",
    `<div id="task-${id}" class="drag" draggable="true" ondragstart="drag(event)" style="background-color:${color}">
            <div id="title-${id}}" class="title">
              <button onClick="remove(this)" class="close">X</button>
              <input list="subjects" name="subject" ${
                title == "" ? "" : 'value="' + title + '"'
              } />

            <p id="content" contentEditable="true" onclick="selectContent(this)">${description}</p>
            <div style="text-align:right; margin:1px">
            <div class="color"></div>

            <div style="clear:both; height:1px"></div>
            </div>
          </div>`
  );
  document.querySelectorAll("#colors option").forEach((el) => {
    document
      .querySelector(`#task-${id} .color`)
      .insertAdjacentHTML(
        "beforeend",
        `<button onClick="changeColor(this, '${
          el.getAttributeNode("value").value
        }')" style="background-color:${
          el.getAttributeNode("value").value
        }"></button>`
      );
  });
}

function reset() {
  columnNames.forEach((columnName) => {
    try {
      const node = document.getElementById(columnName);
      while (node.lastElementChild) {
        node.removeChild(node.lastElementChild);
      }
    } catch (e) {
      console.log(e);
    }
  });
  localStorage.clear();
}

function getVersionDropDown(e) {
  if (e.selectedIndex) {
    syncDown(e.options[e.selectedIndex].value);
  }
  e.selectedIndex = -1;
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

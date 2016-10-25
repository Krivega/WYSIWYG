'use strict';
var TableFiles = (function() {

  function TableFiles(container, data) {
    var self = this;
    self._container = document.getElementById(container);
    self._files = {};
    self._dragEl = {};
    self._allTrs = [];
    self._curSortCol = 0;

    self._curSortUp = true;

    self._init = function(initFiles) {
      self._update();
      self._initEvents();
      if (initFiles && objSize(initFiles) > 0) {
        self._addFilesFromData(initFiles);
      }
      return self;
    };

    self._update = function() {
      self._container.innerHTML =
        '<table class="table table-striped">\
            <thead>\
              <tr>\
                <th style="cursor:pointer;">Name</th>\
                <th style="cursor:pointer;">Size</th>\
                <th style="cursor:pointer;">Date Modified</th>\
              </tr>\
            </thead>\
            <tbody></tbody>\
            <tfoot>\
              <tr>\
                <td colspan="3">\
                  <label for="inputFile' +
        container +
        '">File input</label>\
                  <input type="file" multiple id="inputFile' +
        container +
        '">\
                </td>\
              </tr>\
            </tfoot>\
          </table>';
      self._tbody = self._container.getElementsByTagName('tbody')[0];
      self._inputFile = document.getElementById('inputFile' + container);
      return self;
    };

    self._trToArr = function() {
      self._allTrs.length = 0;
      for (var i = 0; i < self._tbody.children.length; i++) {
        self._allTrs.push(self._tbody.children[i]);
      }
      return self;
    };

    self._initSort = function(newCol, resort) {

      self._trToArr();
      var allTrs = self._allTrs;
      var normalize;

      if (newCol === self._curSortCol && resort === false) {
        self._curSortUp = !self._curSortUp;
      } else {
        self._curSortCol = newCol;
        self._curSortUp = true;
      }

      if (self._curSortCol === 0) {
        normalize = String;
      } else if (self._curSortCol === 1) {
        normalize = String;
      } else if (self._curSortCol === 2) {
        normalize = self._sortDate;
      }
      for (var i = 0, row; i < allTrs.length; i++) {
        row = allTrs[i];
        if (self._curSortCol === 2) {
          row.sortValue = normalize(row.cells[self._curSortCol].getAttribute('data-date'));
        } else {
          row.sortValue = normalize(row.cells[self._curSortCol].innerHTML);
        }
      }

      allTrs.sort(function(a, b) {
        return (a.sortValue > b.sortValue) || -(a.sortValue < b.sortValue);
      });

      if (!self._curSortUp) {
        allTrs.reverse();
      }

      for (var iLenTrs = allTrs.length - 1, last = null; iLenTrs >= 0; iLenTrs--) {
        row = allTrs[iLenTrs];
        row.parentNode.insertBefore(row, last);
        last = row;
      }

      self._arrToSortIcon(newCol);
    };

    self._arrToSortIcon = function(newCol) {
      var rows = self._container.getElementsByTagName('th');
      var th = rows[newCol];
      var icon = th.getElementsByTagName('i');
      if (icon.length === 0) {
        icon = document.createElement('i');
        th.appendChild(icon);
      } else {
        icon = icon[0];
      }
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].getElementsByTagName('i')[0]) {
          rows[i].getElementsByTagName('i')[0].className = '';
        }
      }
      if (self._curSortUp) {
        icon.className = 'glyphicon glyphicon-arrow-up';
      } else {
        icon.className = 'glyphicon glyphicon-arrow-down';
      }
    };

    self.serialize = function() {
      return self._files;
    };

    self._sortDate = function(value) {
      return +new Date(value);
    };

    self._sortTable = function(e) {
      if (e.target.tagName !== 'TH') {
        return;
      }
      var cellIndex = e.target.cellIndex;
      self._initSort(cellIndex, false);
    };

    self._inputFileChange = function(e) {
      self._addFiles(e.target.files);
    };

    self._addFilesFromData = function(files) {
      var name, size, date, id;
      var trs = '';
      for (var key in files) {
        name = files[key].name;
        if (self._files[key]) {
          window.alert('the file(' + name + ') has already been added');
          continue;
        }
        id = files[key].id;
        self._files['name' + name] = files[key];
        self._files['name' + name].id = id;
        size = (files[key].size / 1024 / 1024).toFixed(2) + 'MB';
        date = files[key].lastModifiedDate.toLocaleString();
        trs += '<tr id="' + id + '" data-name="' + 'name' + name + '"><td>' + name + '</td><td>' +
          size + '</td><td data-date="' + files[key].lastModifiedDate + '">' + date + '</td></tr>';
      }

      self._tbody.innerHTML += trs;
      self._initSort(self._curSortCol, true);
      self._makeDraggable();
    };

    self._addFiles = function(files) {
      var name, size, date, id;
      var trs = '';
      for (var i = 0; i < files.length; i++) {
        name = files[i].name;
        if (self._files['name' + name]) {
          window.alert('the file(' + name + ') has already been added');
          continue;
        }
        id = self._guid();
        self._files['name' + name] = files[i];
        self._files['name' + name].id = id;
        size = (files[i].size / 1024 / 1024).toFixed(2) + 'MB';
        date = files[i].lastModifiedDate.toLocaleString();
        trs += '<tr id="' + id + '" data-name="' + 'name' + name + '"><td>' + name + '</td><td>' +
          size + '</td><td data-date="' + files[i].lastModifiedDate + '">' + date + '</td></tr>';
      }

      self._tbody.innerHTML += trs;
      self._initSort(self._curSortCol, true);
      self._makeDraggable();
    };

    self._removeFile = function(el) {
      delete self._files[el.getAttribute('data-name')];
      el.parentNode.removeChild(el);
    };

    self._mouseDown = function(e) {
      if (e.which !== 1) {
        return;
      }
      var el = this;
      var file = self._files[el.getAttribute('data-name')];
      window.DROPFILE = file;
      el.style.opacity = '0.5';
      var elPos = getOffset(this);
      var cloneEl = document.createElement('div');
      cloneEl.id = 'dragObject';
      cloneEl.innerHTML = el.getElementsByTagName('td')[0].innerHTML;
      cloneEl.style.position = 'absolute';
      cloneEl.style.left = elPos.left + 'px';
      cloneEl.style.top = elPos.top + 'px';
      cloneEl.style.width = el.offsetWidth + 'px';
      cloneEl.style.height = el.offsetHeight + 'px';
      cloneEl.style.lineHeight = el.offsetHeight + 'px';
      cloneEl.style.padding = '0 8px';
      cloneEl.style.backgroundColor = '#eee';
      cloneEl.style.verticalAlign = 'middle';
      cloneEl.style.border = '1px dashed #ccc';
      cloneEl.style.cursor = 'move';
      cloneEl.style.mozTransform = 'rotate(1.6deg)';
      cloneEl.style.webkitTransform = 'rotate(1.6deg)';
      cloneEl.style.transform = 'rotate(1.6deg)';

      document.body.appendChild(cloneEl);

      self._dragEl = {
        x: e.pageX,
        y: e.pageY,
        el: this,
        cloneEl: cloneEl,
        mouseOffset: {}
      };
      self._dragEl.mouseOffset.x = e.pageX - elPos.left;
      self._dragEl.mouseOffset.y = e.pageY - elPos.top;
      document.onmousemove = self._mouseMove;
      document.onmouseup = self._mouseUp;
      document.ondragstart = document.body.onselectstart = preventDefault;
      return false;
    };

    self._mouseMove = function(e) {
      if (Math.abs(self._dragEl.x - e.pageX) < 5 && Math.abs(self._dragEl.y - e.pageY) < 5) {
        return false;
      }

      var elem = self._dragEl.cloneEl;
      // var elPos = getOffset(self._dragEl.el);
      elem.style.top = e.pageY - self._dragEl.mouseOffset.y + 'px';
      elem.style.left = e.pageX - self._dragEl.mouseOffset.x + 'px';

      return false;
    };

    self._mouseUp = function(e) {
      document.body.removeChild(self._dragEl.cloneEl);
      document.onmousemove = document.onmouseup = document.ondragstart = document.body.onselectstart =
        null;
      var el = document.elementFromPoint(e.pageX, e.pageY);
      var remove = true;
      while (el) {
        if (el.id && el.id === container) {
          remove = false;
          break;
        }
        el = el.parentNode;
      }
      if (remove) {
        self._removeFile(self._dragEl.el);
      } else {
        self._dragEl.el.style.opacity = '';
        delete window.DROPFILE;
      }
      self._dragEl = null;
    };

    self._mouseUpCont = function(e) {
      var dropFile = window.DROPFILE;
      var add = false;
      var el;
      if (!dropFile) {
        return;
      }
      if (e.target.id === 'dragObject') {
        e.target.style.display = 'none';
        el = document.elementFromPoint(e.pageX, e.pageY);
        e.target.style.display = '';
      } else {
        el = document.elementFromPoint(e.pageX, e.pageY);
      }
      while (el) {
        if (el.id && el.id === container) {
          add = true;
          break;
        }
        el = el.parentNode;
      }
      if (add) {
        if (self._files['name' + dropFile.name]) {
          if ((self._files['name' + dropFile.name].id) !== (dropFile.id)) {
            window.alert('the file(' + dropFile.name + ') has already been added');
            return;
          }

        } else {
          var fileObj = {};
          fileObj['name' + dropFile.name] = dropFile;
          self._addFilesFromData(fileObj);
        }
        delete window.DROPFILE;
      }
    };

    self._makeDraggable = function() {
      var rows = self._tbody.rows;
      for (var i = 0; i < rows.length; i++) {
        rows[i].onmousedown = self._mouseDown;
        rows[i].style.cursor = 'move';
      }
    };

    self._initEvents = function() {
      self._inputFile.addEventListener('change', self._inputFileChange, false);
      self._container.addEventListener('click', self._sortTable, false);
      document.addEventListener('mouseup', self._mouseUpCont, false);
      self._container.addEventListener('dragover', preventDefault, false);
      self._container.addEventListener('drop', function(e) {
        e.preventDefault();
        self._addFiles(e.dataTransfer.files);

      }, false);

      return self;
    };

    self._guid = function() {
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      }

      function guid() {
        return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
      }
      return guid();
    };

    self._init(data);

    return self;
  }

  function objSize(obj) {
    var size = 0,
      key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        size++;
      }
    }
    return size;
  }

  function preventDefault(e) {
    e.preventDefault();
    return false;
  }

  function getOffset(elem) {
    if (elem.getBoundingClientRect) {
      return getOffsetRect(elem);
    } else {
      return getOffsetSum(elem);
    }
  }

  function getOffsetRect(elem) {
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docElem = document.documentElement;

    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;
    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return {
      top: Math.round(top),
      left: Math.round(left)
    };
  }

  function getOffsetSum(elem) {
    var top = 0,
      left = 0;
    while (elem) {
      top = top + parseInt(elem.offsetTop, 10);
      left = left + parseInt(elem.offsetLeft, 10);
      elem = elem.offsetParent;
    }

    return {
      top: top,
      left: left
    };
  }

  return TableFiles;

}());

var tableFiles = new TableFiles('tableFiles');
var tableFiles2 = new TableFiles('tableFiles2');

function mapDOM(element, json) {
  var treeObject = {};
  if (typeof element === 'string') {
    if (window.DOMParser) {
      var parser = new window.DOMParser();
      var docNode = parser.parseFromString(element, 'text/xml');
    } else { 
      docNode = new window.ActiveXObject('Microsoft.XMLDOM');
      docNode.async = false;
      docNode.loadXML(element);
    }
    element = docNode.firstChild;
  }

  function treeHTML(element, object) {
    object.type = element.nodeName;
    var nodeList = element.childNodes;
    if (nodeList !== null) {
      if (nodeList.length) {
        object.content = [];
        for (var i = 0; i < nodeList.length; i++) {
          if (nodeList[i].nodeType === 3) {
            object.content.push(nodeList[i].nodeValue);
          } else {
            object.content.push({});
            treeHTML(nodeList[i], object.content[object.content.length - 1]);
          }
        }
      }
    }
    if (element.attributes !== null) {
      if (element.attributes.length) {
        object.attributes = {};
        for (i = 0; i < element.attributes.length; i++) {
          object.attributes[element.attributes[i].nodeName] = element.attributes[i].nodeValue;
        }
      }
    }
  }
  treeHTML(element, treeObject);

  return (json) ? JSON.stringify(treeObject) : treeObject;
}

function preventDefault (e) {
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
  var top  = box.top +  scrollTop - clientTop;
  var left = box.left + scrollLeft - clientLeft;
 
  return { top: Math.round(top), left: Math.round(left) };
}
  
function getOffsetSum(elem) {
  var top=0, left=0;
  while(elem) {
      top = top + parseInt(elem.offsetTop,10);
      left = left + parseInt(elem.offsetLeft,10);
      elem = elem.offsetParent;     
  }
 
  return {top: top, left: left};
}
  
var EventDispatcher = (function () {     
  function ExpObj() {
    var self = this;
    self._callbackObj = {};
    
    self.on = function(eventName, callback){
      var id = self._guid();
      if(!self._callbackObj[eventName]){
        self._callbackObj[eventName]={};
      }
      self._callbackObj[eventName][id]=function(data){
        callback(data);
      };
      
    };
    
    self.trigger = function(eventName, data){
      for (var item in self._callbackObj[eventName]) {
        self._callbackObj[eventName][item](data);
      }
    };

    self._guid = function () {
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      }
  
      function guid() {
        return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
      }
      return guid();
    };
        
    return self;
  }
  
  return ExpObj;

}());

var eventDispatcher = new EventDispatcher();

var WorkEl = (function (eventDispatcher) {
    
  function ExpObj(elData) {
    var self = this;
    self._dragEl = {};
    self._resizeEl = {};
    
    self._init = function (elData) {
      self._el = elData.dragEl.cloneEl;
      self._el.style.position = '';
      self._el.style.left = '';
      self._el.style.top = '';
      self._el.style.minHeight = self._el.style.height;
      self._el.style.height = '';
      self._el.style.width = '100%';
      self._el.style.backgroundColor = '#428bca';
      self._el.style.color = '#fff';
      self._el.style.border = '1px solid #285e8e';
      self._el.style.cursor = '';
      self._el.style.mozTransform = '';
      self._el.style.webkitTransform = '';
      self._el.style.transform = '';
      
      elData.dropEl.appendChild(self._el);
      self._makeDraggable();
      return self;
    };    
    
    self._makeDraggable = function(){
      self._el.onmousedown = self._mouseDown;
    };
        
    self._mouseDown = function(e){
      if (e.which!==1) {return;}
      e.stopPropagation();
      var el = this;
      var elPos = getOffset(el);
      var mouseOffsetX = e.pageX - elPos.left;
      var mouseOffsetY = e.pageY - elPos.top;
      var mouseOffsetXRight = el.offsetWidth - mouseOffsetX;
      var mouseOffsetYBottom =  el.offsetHeight - mouseOffsetY;
      if(mouseOffsetYBottom<10){ 
        self._resizeEl = { x: e.pageX, y: e.pageY,offsetWidth:el.offsetWidth,offsetHeight:el.offsetHeight, el: el, styleBorder: el.style.border, mouseOffset:{} };
        self._resizeEl.mouseOffset.x = mouseOffsetX;
        self._resizeEl.mouseOffset.y = mouseOffsetY;
        self._el.style.cursor = 's-resize';
        self._el.style.borderBottom = '2px dashed #000';
        document.onmousemove = self._mouseMoveResizeYBottom;
        document.onmouseup = self._mouseUpResize;
        document.ondragstart = document.body.onselectstart = preventDefault;
        return false;
      }
      
      if(mouseOffsetXRight<10){ 
        self._resizeEl = { x: e.pageX, y: e.pageY,offsetWidth:el.offsetWidth,offsetHeight:el.offsetHeight, el: el, styleBorder: el.style.border, mouseOffset:{} };
        self._resizeEl.mouseOffset.x = mouseOffsetX;
        self._resizeEl.mouseOffset.y = mouseOffsetY;
        self._el.style.cursor = 'e-resize';
        self._el.style.borderRight = '2px dashed #000';
        document.onmousemove = self._mouseMoveResizeXRight;
        document.onmouseup = self._mouseUpResize;
        document.ondragstart = document.body.onselectstart = preventDefault;
        return false;
      }
      
      el.style.opacity = '0.5';
      var cloneEl = document.createElement('div');
      cloneEl.id = 'dragObject';
      cloneEl.innerHTML = el.innerHTML;
      cloneEl.style.position = 'absolute';
      cloneEl.style.left = elPos.left+'px';
      cloneEl.style.top = elPos.top+'px';
      cloneEl.style.width = el.offsetWidth+'px';
      cloneEl.style.minHeight = el.offsetHeight+'px';
      cloneEl.style.lineHeight = el.offsetHeight+'px';
      cloneEl.style.padding = '0 8px';
      cloneEl.style.backgroundColor = '#eee';
      cloneEl.style.verticalAlign = 'middle';
      cloneEl.style.border = '1px dashed #ccc';
      cloneEl.style.cursor = 'move';
      cloneEl.style.mozTransform = 'rotate(1.6deg)';
      cloneEl.style.webkitTransform = 'rotate(1.6deg)';
      cloneEl.style.transform = 'rotate(1.6deg)';

      document.body.appendChild(cloneEl);
      self._dragEl = { x: e.pageX, y: e.pageY, el: el, cloneEl: cloneEl, mouseOffset:{} };
      self._dragEl.mouseOffset.x = mouseOffsetX;
      self._dragEl.mouseOffset.y = mouseOffsetY;
      document.onmousemove = self._mouseMove;
      document.onmouseup = self._mouseUp;
      document.ondragstart = document.body.onselectstart = preventDefault;
      return false;
    };
    
    self._mouseMove = function(e){  
      if (Math.abs(self._dragEl.x-e.pageX)<5 && Math.abs(self._dragEl.y-e.pageY)<5) {
        return false;
      }
      
      var elem  = self._dragEl.cloneEl;
      elem.style.top =  e.pageY-self._dragEl.mouseOffset.y +'px';
      elem.style.left = e.pageX-self._dragEl.mouseOffset.x +'px';
      
      return false;
    };
    
    self._mouseUp = function(e){
      document.body.removeChild(self._dragEl.cloneEl);
      document.onmousemove = document.onmouseup = document.ondragstart = document.body.onselectstart = null;
      var el = document.elementFromPoint(e.pageX - window.pageXOffset,e.pageY - window.pageYOffset);
      var dropEl = el;
      self._dragEl.el.style.opacity = '';
      self._dragEl = null;
      if(dropEl===self._el){
        var selected = document.getElementById('selectedEl');
        if(selected){
          selected.id='';
        }
        self._el.id = 'selectedEl';
        return false;
      }
      var add = false;  
      while (el) {
        if (el.id && el.id==='workflow'){
          add = true;
          break;
        }
        el = el.parentNode;
      }
      if(add){
        dropEl.appendChild(self._el);
      }else{
        self._el.parentNode.removeChild(self._el);
        self = null;
      }
    };    
    
    self._mouseMoveResizeXRight = function(e){  
      if (Math.abs(self._resizeEl.x-e.pageX)<5 && Math.abs(self._resizeEl.y-e.pageY)<5) {
        return false;
      }      
      self._el.style.width = self._resizeEl.offsetWidth+(e.pageX-self._resizeEl.x)+'px';

      return false;
    };    
    
    self._mouseMoveResizeYBottom = function(e){  
      if (Math.abs(self._resizeEl.x-e.pageX)<5 && Math.abs(self._resizeEl.y-e.pageY)<5) {
        return false;
      }
      
      self._el.style.height = self._resizeEl.offsetHeight+(e.pageY-self._resizeEl.y)+'px';
      return false;
    };
    
    self._mouseUpResize = function(e){
      self._el.style.cursor = '';
      self._el.style.border = self._resizeEl.styleBorder;
      document.onmousemove = document.onmouseup = document.ondragstart = document.body.onselectstart = null;
      self._resizeEl = null;
    };
    
    self._init(elData);
    
    return self;
  }
  
  return ExpObj;

}(eventDispatcher));


var Tool = (function (eventDispatcher) {
    
  function ExpObj(container, type) {
    var self = this;
    self._container = document.getElementById(container);
    self._dragEl = {};    
    
    self._init = function (type) {
      self._update(type);
      return self;
    };
    
    self._update = function (type) {
      var id = type+self._guid();
      self._el = document.createElement('div');
      self._el.id = id;
      self._el.className = 'tool';
      self._el.innerHTML = type;
      self._container.appendChild(self._el);
      self._makeDraggable();
      return self;
    };    
    
    self._mouseDown = function(e){
      if (e.which!==1) {return;}
      var el = this;
      el.style.opacity = '0.5';
      var elPos = getOffset(el);
      var cloneEl = document.createElement('div');
      cloneEl.id = 'dragObject';
      cloneEl.innerHTML = el.innerHTML;
      cloneEl.style.position = 'absolute';
      cloneEl.style.left = elPos.left+'px';
      cloneEl.style.top = elPos.top+'px';
      cloneEl.style.width = el.offsetWidth+'px';
      cloneEl.style.height = el.offsetHeight+'px';
      cloneEl.style.lineHeight = el.offsetHeight+'px';
      cloneEl.style.padding = '0 8px 4px 8px';
      cloneEl.style.backgroundColor = '#eee';
      cloneEl.style.verticalAlign = 'middle';
      cloneEl.style.border = '1px dashed #ccc';
      cloneEl.style.cursor = 'move';
      cloneEl.style.mozTransform = 'rotate(1.6deg)';
      cloneEl.style.webkitTransform = 'rotate(1.6deg)';
      cloneEl.style.transform = 'rotate(1.6deg)';

      document.body.appendChild(cloneEl);
      
      self._dragEl = { x: e.pageX, y: e.pageY, el: this, cloneEl: cloneEl, mouseOffset:{} };
      self._dragEl.mouseOffset.x = e.pageX - elPos.left;
      self._dragEl.mouseOffset.y = e.pageY - elPos.top;
      document.onmousemove = self._mouseMove;
      document.onmouseup = self._mouseUp;
      document.ondragstart = document.body.onselectstart = preventDefault;
      return false;
    };
    
    self._mouseMove = function(e){  
      if (Math.abs(self._dragEl.x-e.pageX)<5 && Math.abs(self._dragEl.y-e.pageY)<5) {
        return false;
      }
      
      var elem  = self._dragEl.cloneEl;
      elem.style.top =  e.pageY-self._dragEl.mouseOffset.y +'px';
      elem.style.left = e.pageX-self._dragEl.mouseOffset.x +'px';
      
      return false;
    };
    
    self._mouseUp = function(e){
      document.body.removeChild(self._dragEl.cloneEl);
      document.onmousemove = document.onmouseup = document.ondragstart = document.body.onselectstart = null;  
      var el = document.elementFromPoint(e.pageX - window.pageXOffset,e.pageY - window.pageYOffset);
      var dropEl = el;
      var add = false;  
      while (el) {
        if (el.id && el.id==='workflow'){
          add = true;
          break;
        }
        el = el.parentNode;
      }
      if(add){
        eventDispatcher.trigger('createEl',{dropEl:dropEl, dragEl: self._dragEl});
      }
      self._dragEl.el.style.opacity = '';
      self._dragEl = null;
    };
    
    self._makeDraggable = function(){
      self._el.onmousedown = self._mouseDown;
    };

    self._guid = function () {
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      }
  
      function guid() {
        return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
      }
      return guid();
    };
    
    self._init(type);
    
    return self;
  }  
  
  return ExpObj;

}(eventDispatcher));

var Position = (function () {
    
  function ExpObj(container) {
    var self = this;
    self._container = document.getElementById(container);
    
    self._init = function () {
      self._update();
      return self;
    };
    
    self._update = function () {
      self._el = document.createElement('div');
      self._el.className = 'position panel panel-success';
      self._el.innerHTML =  '\
        <div class="row">\
          <div class="col-md-4"></div>\
          <div class="col-md-4 resize resize-top" style="text-align:center;"><span class="glyphicon glyphicon-chevron-up"></span></div>\
          <div class="col-md-4"></div>\
        </div>\
        <div class="row">\
          <div class="col-md-4 resize resize-left"><span class="glyphicon glyphicon-chevron-left"></span></div>\
          <div class="col-md-4"><input id="resizeVal" value="1" style="width: 100%;" type="number"></div>\
          <div class="col-md-4 resize resize-right" style="text-align:right;"><span class="glyphicon glyphicon-chevron-right"></span></div>\
        </div>\
        <div class="row">\
          <div class="col-md-4"></div>\
          <div class="col-md-4 resize resize-bottom" style="text-align:center;"><span class="glyphicon glyphicon-chevron-down"></span></div>\
          <div class="col-md-4"></div>\
        </div>';
      self._container.appendChild(self._el);
      self._initEvents();
      return self;
    };
    
    self._editMargin = function(e){
      var selected = document.getElementById('selectedEl');
      if(!selected){
        return false;
      }
      var resizeVal = parseInt(document.getElementById('resizeVal').value,10);
      if(!resizeVal){
        resizeVal = 1;
      }
      var el = e.target;
      var top = false;
      var right = false;
      var bottom = false;
      var left = false;
      while (el) {
        if (el.className && el.className.indexOf('resize-top')!==-1){
          top = true;
          break;
        }
        if (el.className && el.className.indexOf('resize-right')!==-1){
          right = true;
          break;
        }
        if (el.className && el.className.indexOf('resize-bottom')!==-1){
          bottom = true;
          break;
        }
        if (el.className && el.className.indexOf('resize-left')!==-1){
          left = true;
          break;
        }
        el = el.parentNode;
      }
      if(top){
        if(selected.style.marginTop){
          selected.style.marginTop=resizeVal+parseInt(selected.style.marginTop,10) +'px';
        }else{
          selected.style.marginTop=resizeVal+'px';
        }
      }else if(right){
        if(selected.style.marginRight){
          selected.style.marginRight=resizeVal+parseInt(selected.style.marginRight,10) +'px';
        }else{
          selected.style.marginRight=resizeVal+'px';
        }        
      }else if(bottom){
        if(selected.style.marginBottom){
          selected.style.marginBottom=resizeVal+parseInt(selected.style.marginBottom,10) +'px';
        }else{
          selected.style.marginBottom=resizeVal+'px';
        }        
      }else if(left){
        if(selected.style.marginLeft){
          selected.style.marginLeft=resizeVal+parseInt(selected.style.marginLeft,10) +'px';
        }else{
          selected.style.marginLeft=resizeVal+'px';
        }        
      }
    };

    self._initEvents = function () {
      self._el.addEventListener( 'click' , self._editMargin, false);
      return self;
    }; 
    
    self._init();
    
    return self;
  }  
  
  return ExpObj;

}(eventDispatcher));

eventDispatcher.on('createEl', function (data) {
  new WorkEl(data);
});

var imageTool = new Tool('tools', 'image');
var textTool = new Tool('tools', 'text');
var tableTool = new Tool('tools', 'table');
var position = new Position('tools');


document.getElementById('workflow').addEventListener('click', function (e) {
  var selected = document.getElementById('selectedEl');
  if(selected){
    selected.id='';
  }
}, false);

document.getElementById('saveJSON').addEventListener('click', function (e) {
  var button = this;
  if(button.disabled ===false){
    var valButton = button.innerHTML;
    button.innerHTML = 'Saving...';
    button.disabled = true;
    var workflow = document.getElementById('workflow');
    var json = mapDOM(workflow, true);
    console.log('json ', json);
    setTimeout(function () {
      button.innerHTML = valButton;
      button.disabled = false;
    },2000);
  }
}, false);
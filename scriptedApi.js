var ScriptedJob;
function scrKOParams(){
  var form = document.getElementById("scr-ko-form");
  var params = new Array();
  for (var i = 0; i < form.elements.length; i++) {
    el = form.elements[i];
    if (el.tagName == 'TEXTAREA'){
      params[el.name] = el.value;
    } else if (el.tagName == 'INPUT'){
      if (el.type == 'text' || el.type == 'hidden'){
        params[el.name] = el.value;
      }
      else if (el.type == 'radio' && el.checked){
        if (!el.value) params[el.name] = "on";
        else params[el.name] = el.value;
      }
      else if (el.type == 'checkbox' && el.checked){
        if (!el.value) params[el.name] = "on";
        else params[el.name] = el.value;
      }
    }
  }
  return params;
}
function ScrKOOption(parentId, label){
  var self = this;
  self.parentId = parentId;
  self.label = label;
  self.id = function(){ return self.label.toLowerCase().replace(" ", "_"); };
  self.checkboxName = ko.computed(function(){
    return "form_fields[" + self.parentId + "][" + self.id() + "]";
  });
  self.radioName = ko.computed(function(){
    return "form_fields[" + self.parentId + "]";
  });
}
function ScrKOField(v){
  var self = this;
  self.id = v[0];
  self.name =  v[1];
  self.description = v[2];
  self.type = v[3];
  self.options = [];
  if (v[4]) for (var k = 0; k < v[4].length; k++) self.options.push(new ScrKOOption(self.id, v[4][k]));
  self.inputName = function(){ return "form_fields[" + self.id + "]"; };
}
function ScrKOFormat(id, name, price, minCount){
  var self = this;
  self.id = id;
  self.name = name;
  self.pluralName = ko.computed(function(){
    return self.name.charAt(self.name.length - 1) == "s" ? self.name : self.name + "s";
  });
  self.price = price;
  self.minCount = minCount;
  self.fields = ko.observableArray();
}
function ScrKOJob(submissionUrl, submittedFunction, callbackFunction) {
  var self = this;
  self.format = ko.observable();
  self.formats = ko.observableArray();
  self.setFormat = function(id){
    var format = ko.utils.arrayFirst(self.formats(), function(f) { return id === f.id; });
    if (format){
      self.format(format);
      self.count(format.minCount);
    }
  };
  self.count = ko.observable();
  self.tooFew = ko.computed(function(){
    if (self.format() == undefined) return false;
    return isNaN(parseInt(self.count())) || self.format().minCount > parseInt(self.count());
  });
  self.price = ko.computed(function(){
    if (self.format() == undefined) return 0;
    return parseInt(self.count()) * self.format().price;
  });
  self.getFormats = function(){
    var ajax = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    ajax.onreadystatechange = function(){
      if (ajax.readyState == 4 && ajax.status == 200){
        var formats = JSON.parse(ajax.responseText);
        for (var i = 0; i < formats.length; i++){
          var f = new ScrKOFormat(formats[i]["id"], formats[i]["name"], formats[i]["price"], formats[i]["min_count"]);
          for (var j = 0; j < formats[i]["form_fields"].length; j++){
            f.fields.push(new ScrKOField(formats[i]["form_fields"][j]));
          }
          self.formats.push(f);
        }
      }
    }
    ajax.open("GET","https://scripted.com/formats", true);
    ajax.send();
  };
  self.valid = ko.observable(true);
  self.submit = function(){
    if (!self.tooFew()){
      self.valid(true);
      var params = scrKOParams();
      var paramString = "";
      var detailsLength = 0;
      for (var i = 0; i < Object.keys(params).length; i++){
        var n = Object.keys(params)[i];
        var v = params[n];
        if (n == "form_fields[topic]"){
          if (v.length < 10) self.valid(false);
        } else {
          if (n != "format_id" && n != "count") detailsLength += v.length;
        }
        paramString += n + "=" + encodeURIComponent(v) + "&"
      }
      console.log(detailsLength);
      if (detailsLength < 10) self.valid(false);
      if (self.valid()){
        var ajax = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        ajax.onreadystatechange = function(){
          if (ajax.readyState == 4 && ajax.status == 200){
            var job = JSON.parse(ajax.responseText);
            if (callbackFunction && callbackFunction != undefined) callbackFunction(job);
          }
        };
        ajax.open("POST", submissionUrl, true);
        ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        ajax.send(paramString);
        if (submittedFunction && submittedFunction != undefined) submittedFunction();
      }
    }
    return false;
  };
}
function initiateScriptedAPI(submissionUrl, submittedFunction, callbackFunction){
  ScriptedJob = new ScrKOJob(submissionUrl, submittedFunction, callbackFunction);
  ko.applyBindings(ScriptedJob, document.getElementById("scr-ko-wrpr"));
  ScriptedJob.getFormats();
}
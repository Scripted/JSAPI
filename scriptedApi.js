var ScriptedJob;
function scrKOParams(job){
    params = {};
    params.count = job.count();
    params.format_id = job.format().id;
    params.form_fields = {};
    var formatFields = job.format().fields();
    for(var i = 0; i < formatFields.length; i++){
        var field = formatFields[i];
        params.form_fields[field.id] = field.parameterizedValue();
    }
    console.dir(params);
  return params;
}
function ScrKOOption(parentId, label){
  var self = this;
  self.parentId = ko.observable(parentId);
  self.label = label;
  self.checked = ko.observable(false);
}
function ScrKOField(v){
  var self = this;
  var numBullets = 5;
  self.id = v[0];
  self.name =  v[1];
  self.description = v[2];
  self.type = v[3];
  self.options = [];
  self.value = ko.observable();
  self.bullets = ko.observableArray();
  self.addBullet = function(){
      self.bullets.push(new ScrKOBullet(self.bullets().length));
  }
  if(self.type == 'bullets'){
      for(var i = 0; i < numBullets; i++){
          self.addBullet();
      }
  }

  if (v[4]) for (var k = 0; k < v[4].length; k++) self.options.push(new ScrKOOption(self.id, v[4][k]));
  self.parameterizedValue = function(){
      var value;
      if(self.type == 'bullets'){
          value = [];
          for(var i = 0; i < self.bullets().length; i++){
              var v = self.bullets()[i].value();
              if(v) value.push(v);
          }
      } else if(self.type == 'text_field' || self.type == 'text_area'){
          value = self.value();
      } else if(self.type == 'checkboxes'){
          value = [];
          for(var i = 0; i < self.options.length; i++){
              var v = self.options[i];
              if(v.checked()) value.push(v.label);         
          } 
      } else if(self.type == 'radios'){
          var checked = ko.utils.arrayFirst(self.options, function(item) {
              return item.checked();
          });
          
          if(checked != undefined) value = checked.label;
      }
      
      return value;
  }
}
function ScrKOBullet(index){
    this.index = index;
    this.value = ko.observable();
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
    ajax.open("GET","/formats.json", true);
    ajax.send();
  };
  self.valid = ko.observable(true);
  self.submit = function(){
    if (!self.tooFew()){
      self.valid(true);
      var params = scrKOParams(self);
      var detailsLength = 0;
      for (var i = 0; i < Object.keys(params.form_fields).length; i++){
        var n = Object.keys(params)[i];
        var v = params[n];
        if (n == "topic"){
          if (v.length < 10) self.valid(false);
        } else {
          if(typeof v == 'string') detailsLength += v.length;
        }
      }
      console.dir(params);
      var paramString = JSON.stringify(params);
      console.log(paramString);
      if (detailsLength < 10) self.valid(false);
      if (self.valid()){
        var ajax = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        ajax.onreadystatechange = function(){
          if (ajax.readyState == 4 && ajax.status == 200){
            var job = JSON.parse(ajax.responseText);
            if (callbackFunction) callbackFunction(job);
          }
        };
        ajax.open("POST", submissionUrl, true);
        ajax.setRequestHeader("Content-type", "application/json");
        ajax.send(paramString);
        if (submittedFunction) submittedFunction();
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
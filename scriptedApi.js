var ScriptedJob;
function ScrKOJob(submissionUrl, industriesAndGuidelines, submittedFunction, callbackFunction) {
  
  // Constants
  var TOPIC_ERROR = "Please provide a more descriptive topic.";
  var TOPIC_THRESHOLD = 10;
  var DETAIL_ERROR = "Please provide more details.";
  var DETAIL_THRESHOLD = 10;
  var EXPERTISE_MARKUP = 2;
  
  var self = this;
  self.count = ko.observable();
  self.industriesAndGuidelines = industriesAndGuidelines;
  
  // Function for returning formats, industries and guidelines
  self.getResources = function(endpoint, callback){
    var ajax = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    ajax.onreadystatechange = function(){
      if (ajax.readyState == 4 && ajax.status == 200){
        var resp = JSON.parse(ajax.responseText);
        callback(resp);
      }
    };
    ajax.open("GET", endpoint, true);
    ajax.send();
  };
  self.collectResourceIds = function(resources){
    var ids = new Array();
    for (var i = 0; i < resources.length; i++) ids.push(resources[i].id);
    return ids;
  };
  
  // Formats
  self.format = ko.observable();
  self.formats = ko.observableArray();
  self.setFormat = function(id){
    var format = ko.utils.arrayFirst(self.formats(), function(f) { return id === f.id; });
    if (format){
      self.format(format);
      self.count(format.minCount);
    }
  };
  self.parseFormats = function(formats){
    for (var i = 0; i < formats.length; i++){
      var f = new Format(formats[i]["id"], formats[i]["name"], formats[i]["price"], formats[i]["min_count"]);
      for (var j = 0; j < formats[i]["form_fields"].length; j++){
        f.fields.push(new Field(formats[i]["form_fields"][j]));
      }
      self.formats.push(f);
    }
  };
  
  // Format-dependant attributes
  self.tooFew = ko.computed(function(){
    if (self.format() == undefined) return false;
    return isNaN(parseInt(self.count())) || self.format().minCount > parseInt(self.count());
  });
  self.price = ko.computed(function(){
    if (self.format() == undefined) return 0;
    var p = parseInt(self.count()) * self.format().price;
    if (self.requiresExpertise()) p *= EXPERTISE_MARKUP;
    return p;
  });

  // Teams
  self.getTeams = function(){
    self.teams([]);
    if (self.requiresExpertise()){
      var query = "?";
      for (var i = 0; i < self.selectedIndustries().length; i++){
        query += "industry_ids[]=";
        query += self.selectedIndustries()[i].id;
        query += "&";
      }
      self.getResources("https://scripted.com/teams" + query, self.parseTeams);
    }
  };
  self.requiresExpertise = ko.observable(false);
  self.requiresExpertise.subscribe(self.getTeams);
  self.teams = ko.observableArray();
  self.selectedTeam = ko.observable();
  self.parseTeams = function(teams){
    self.teams([]);
    for (var i = 0; i < teams.length; i++){
      self.teams.push(new Team(teams[i].id, teams[i].name));
    }
  };
  
  // Industries
  self.industries = ko.observableArray();
  self.selectedIndustries = ko.observableArray();
  self.selectedIndustries.subscribe(self.getTeams);
  self.parseIndustries = function(industries){
    for (var i = 0; i < industries.length; i++){
      var industry = new Industry(industries[i].id, industries[i].name);
      self.industries.push(industry);
    }
  };
  
  // Guidelines
  self.guidelines = ko.observableArray();
  self.selectedGuidelines = ko.observableArray();
  self.parseGuidelines = function(guidelines){
    for (var i = 0; i < guidelines.length; i++){
      var guideline = new Guideline(guidelines[i].id, guidelines[i].name, guidelines[i].kind);
      self.guidelines.push(guideline);
    }
  };
  
  self.errors = ko.observableArray();
  self.parameterize = function(){
    params = new Object();
    params.count = self.count();
    params.format_id = self.format().id;
    if (self.industriesAndGuidelines){
      params.industry_ids = self.collectResourceIds(self.selectedIndustries());
      params.guideline_ids = self.collectResourceIds(self.selectedGuidelines());
      if (self.requiresExpertise() && self.selectedTeam()) params.team_id = self.selectedTeam().id;
    }
    params.form_fields = new Object();
    var formatFields = self.format().fields();
    for (var i = 0; i < formatFields.length; i++) {
      var field = formatFields[i];
      params.form_fields[field.id] = field.parameterizedValue();
    }
    return params;
  };
  self.validParamString = function() {
    self.errors([]);
    var params = self.parameterize();
    var detailsLength = 0;
    for (var i = 0; i < Object.keys(params.form_fields).length; i++){
      var n = Object.keys(params.form_fields)[i];
      var v = params.form_fields[n];
      if (n == "topic"){
        if (v == undefined || v.length < TOPIC_THRESHOLD) self.errors.push(TOPIC_ERROR);
      } else {
        if (typeof(v) == 'string') detailsLength += v.length;
      }
    }
    if (detailsLength < DETAIL_THRESHOLD) self.errors.push(DETAIL_ERROR);
    if (self.errors().length == 0) return JSON.stringify(params);
    return false;
  };
  self.submit = function(){
    if (!self.tooFew()){
      var validParamString = self.validParamString();
      if (validParamString) {
        var ajax = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        ajax.onreadystatechange = function(){
          if (ajax.readyState == 4){
            var resp = JSON.parse(ajax.responseText);
            if (resp.errors) self.errors(resp.errors);
            else if (callbackFunction) callbackFunction(resp);
          }
        };
        ajax.open("POST", submissionUrl, true);
        ajax.setRequestHeader("Content-type", "application/json");
        ajax.send(validParamString);
        if (submittedFunction) submittedFunction();
      }
    }
    return false;
  };
  function Option(parentId, label){
    var self = this;
    self.parentId = ko.observable(parentId);
    self.label = label;
    self.checked = ko.observable(false);
  }
  function Field(v){
    var self = this;
    var numBullets = 3;
    self.id = v[0];
    self.name =  v[1];
    self.description = v[2];
    self.type = v[3];
    self.options = [];
    self.value = ko.observable();
    self.bullets = ko.observableArray();
    self.addBullet = function(){
      self.bullets.push(new Bullet(self.bullets().length));
    }
    self.parameterizedValue = function() {
      var value;
      if (self.type == 'bullets') {
        value = [];
        for (var i = 0; i < self.bullets().length; i++) {
          var v = self.bullets()[i].value();
          if (v) value.push(v);
        }
      } else if (self.type == 'text_field' || self.type == 'text_area') {
        value = self.value();
      } else if (self.type == 'checkboxes') {
        value = [];
        for(var i = 0; i < self.options.length; i++){
          var v = self.options[i];
          if (v.checked()) value.push(v.label);
        }
      } else if (self.type == 'radios') {
        var checked = ko.utils.arrayFirst(self.options, function(item) { return item.checked(); });
        if (checked) value = checked.label;
      }
      return value;
    }
    self.load = function(){
      if (self.type == 'bullets') {
        for (var i = 0; i < numBullets; i++) self.addBullet();
      }
      if (v[4]) {
        for (var k = 0; k < v[4].length; k++) self.options.push(new Option(self.id, v[4][k]));
      }
    };
    self.load();
  }
  function Bullet(index){
    this.value = ko.observable();
  }
  function Format(id, name, price, minCount){
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
  function Guideline(id, name, kind){
    this.id = id;
    this.name = kind + ": " + name;
  }
  function Industry(id, name){
    this.id = id;
    this.name = name;
  }
  function Team(id, name){
    this.id = id;
    this.name = name;
  }
}
function initiateScriptedAPI(submissionUrl, industriesAndGuidelines, submittedFunction, callbackFunction){
  ScriptedJob = new ScrKOJob(submissionUrl, industriesAndGuidelines, submittedFunction, callbackFunction);
  ko.applyBindings(ScriptedJob, document.getElementById("scr-ko-wrpr"));
  ScriptedJob.getResources("https://scripted.com/formats", ScriptedJob.parseFormats);
  if (industriesAndGuidelines){
    ScriptedJob.getResources("https://scripted.com/industries", ScriptedJob.parseIndustries);
    ScriptedJob.getResources("https://scripted.com/guidelines", ScriptedJob.parseGuidelines);
  }
}
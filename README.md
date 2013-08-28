# Scripted JavaScript API

## Installation

### Link to the API

Add this to the **head** of any HTML page:
  
    <script type="text/javascript" src="//dqwfo90o1roqt.cloudfront.net/scripted.js"></script>
    
### Add the Form

Paste the [job creation form](/views/create_form.erb) wherever you'd like it in your DOM.

### Initiate the API

The initiation function takes four parameters:

+ **String** The endpoint where you'd like to post the job details.
+ **Boolean** Whether or not to include multiple-selects for industries and guidelines.
+ **Function** What to call immediately after the job is sent.
+ **Function** What to call with the successfully added job as a param.

Call it **once the document is ready**.

    initiateScriptedAPI(
      // This is the endpoint on your server that handles the parameters 
      // and passes them to Scripted. See the example in controller.rb
      "/create_scripted_job",
      // If you don't want to include selects for industries and guidelines,
      // you can set default values for each by logging into your Scripted dashboard.
      // Alternatively, you could add functionality in your own dashboard that
      // assigns two arrays (for industry and guideline ids) to each of your customers.
      // You could then pass those arrays from your server to the Scripted API on job creation.
      true,
      // This is the function that gets called immediately after a job has been submitted.
      // You can do whatever you want here. In this example, we clear the form,
      // reset the job's count, and alert the user.
      function(){
        document.getElementById("scr-ko-form").reset();
        ScriptedJob.count(ScriptedJob.format().minCount);
        alert("Thanks! Your job has been added.");
      }, 
      // This is the function that gets called once the job has been sent to Scripted.
      // You can do whatever you want here. In this example, we append its topic to a list.
      // It takes the job itself as its only param.
      function(job){
        var newLi = document.createElement("LI");
        var t = document.createTextNode(job.topic);
        newLi.appendChild(t);
        document.getElementById("jobs-created").appendChild(newLi);
      }
    );
    

### Customize the Form

You can add classes, ids and rewrite the copy of the [job creation form](/views/create_form.erb).

### Set up your server-side logic

You can find some sample server-side code in [the controller](/controller.rb), but your implementation will differ based on your servers language and framework.

## Demo

If you want to tinker with the JavaScript API itself, you should checkout the [Editable branch](https://github.com/Scripted/JSAPI/tree/Editable).

To get the demo set up, just fork this repository, clone it locally, cd into the directory, install the required gems
    
    gem install sinatra
    gem install json

and then run

    ruby controller.rb
    
It's a very simple [sinatra app](http://www.sinatrarb.com/), and the controller requires you actually providing your **business_id** and **key**.
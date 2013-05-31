# the Scripted Javascript API

## Installation

### Link to the API

Add this to the **head** of any HTML page:
  
    <script type="text/javascript" src="//d21fs2dffuo6hx.cloudfront.net/scripted.js"></script>
    
### Add the Form

Paste the [job creation form](/views/create_form.erb) wherever you'd like it in your DOM.

### Initiate the API

The initiation function takes three parameters:

+ The endpoint where you'd like to post the job details.
+ The javascript function to call immediately after the job is sent.
+ The javascript function to call with the successfully added job as a param.

Call it **once the document is ready**.

    initiateScriptedAPI("/create_scripted_job", 
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

If you'd like to demo the API, you should be able to clone this repository, cd into the directory and run

    ruby controller.rb
    
It's a very simple [sinatra app](http://www.sinatrarb.com/), and the controller requires you actually providing your **business_id** and **key**.
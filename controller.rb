require 'sinatra'
require 'erb'
require 'json'
require 'net/http'

set :bind, '0.0.0.0'

get '/' do
  erb :index
end

get '/api.js' do
  content_type 'text/javascript'
  File.read('scriptedApi.js')
end

get '/formats.json' do
  content_type 'application/json'
  File.read('formats.json')
end

get '/knockout.js' do
  content_type 'text/javascript'
  File.read('knockout.js')
end

# This is where you send the job to Scripted, and stash the job's id in your database. 
post '/create_scripted_job' do

  params = JSON.parse(request.body.read)
  p params
  
  # The params that the javasript api sends to the controller will look like this:
  
  # { 
  #   "format_id" => "4f0ffb43d684123c5a00000b", 
  #   "count" => "2", 
  #   "form_fields" => 
  #     {
  #       "topic" => "10 Reasons to Use the Scripted JSAPI", 
  #       "things_to_mention" => "Knockout, Javascript", 
  #       "things_to_avoid" => "Religion, Politics, Backbone.js", 
  #       "sample_blog" => "blog.scripted.com", 
  #       "preferred_structure" => "Top 10 List", 
  #       "keywords" => "javascript, restful, api", 
  #       "additional_notes" => "Make it great!"
  #     }
  # }
  
  # And all you need to do is append your business_id and key to those params.
  # You can find your business_id and key by logging in to Scripted
  # and navigating to scripted.com/api
  
  params['business_id'] = '502f32ec57440525e00054a5'
  params['key'] = 'mdUbJRb2HypG2yDQuZrz'
  
  # Obviously don't send sandbox=true if you don't want it to be sandboxed.
  params['sandbox'] = true

  # Then send it to Scripted!
  req = Net::HTTP::Post.new('/jobs/create', initheader = { 'Content-Type' => 'application/json' })
  req.body = params.to_json
  response = Net::HTTP.new('scripted.com').start { |http| http.request(req) }
  
  # In order for the final javascript callback function to work, you must render the response body as JSON.
  content_type :json
  response.body
end

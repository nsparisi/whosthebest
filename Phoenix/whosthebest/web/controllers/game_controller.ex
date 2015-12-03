defmodule Whosthebest.GameController do
    use Whosthebest.Web, :controller
    
    def index(conn, _params) do
        render conn, "index.html"
    end
    
    def show(conn, %{"messenger" => messenger} = params) do
    
        # pattern matching that assigns the key 
        # into the variable, but fails if key does not exist
        %{"messenger" => messenger} = params
        
        # alternatively, can call helper method
        # Dict.get/2 to retrieve a value from a Dict
        messenger = Dict.get(params, "messenger") 
        
        # params can have many kvps
        secret = Dict.get(params, "secret") 
        
        # return whatever render is supposed to do
        render conn, "show.html", messenger: messenger
    end
end

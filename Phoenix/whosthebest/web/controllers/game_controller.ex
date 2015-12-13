defmodule Whosthebest.GameController do
    use Whosthebest.Web, :controller
    
    def index(conn, _params) do
        # get the logged in username from the browsing session
        username = get_session(conn, :username)        
        
        # if they are not logged in, redirect
        if !username do
            conn
                |> put_flash(:error, "Please login via /users/login/<username>.")
                |> redirect(to: page_path(conn, :index))
        end
        
        # get the user from the DB
        user = Repo.get_by(Whosthebest.User, name: username) 
        
        # generate a token based on the user unique id
        token = Phoenix.Token.sign(conn, "user_id", user.id)
        conn = assign(conn, :user_token, token)
        
        # get the user's game_id, so they can join the correct game room
        last_game_id = user.last_game_id
        render conn, "index.html", last_game_id: last_game_id
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

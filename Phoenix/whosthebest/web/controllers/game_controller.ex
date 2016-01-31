defmodule Whosthebest.GameController do
    use Whosthebest.Web, :controller
    
    def index(conn, _params) do
        # get the logged in username from the browsing session
        user = conn.assigns[:current_user]
        
        # if they are not logged in, redirect
        if !user do
            conn
                |> put_flash(:error, "Must be logged in to play.")
                |> redirect(to: page_path(conn, :index))
        end
        
        # get the full user from the DB
        user = Repo.get(Whosthebest.User, user.id)
        
        # if they are not logged in, redirect
        if !user.last_game_id do
            conn
                |> put_flash(:error, "Need to be matched to play.")
                |> redirect(to: page_path(conn, :index))
        end
        
        # generate a token based on the user unique id
        token = Phoenix.Token.sign(conn, "user_id", user.id)
        conn = assign(conn, :user_token, token)
        
        # get the user's game_id, so they can join the correct game room
        render conn, "index.html", last_game_id: user.last_game_id
    end
    
    def show(conn, %{"messenger" => messenger} = params) do
    
        # pattern matching that assigns the key 
        # into the variable, but fails if key does not exist
        %{"messenger" => messenger} = params
        
        # alternatively, can call helper method
        # Map.get/2 to retrieve a value from a Map
        messenger = Map.get(params, "messenger") 
        
        # params can have many kvps
        secret = Map.get(params, "secret") 
        
        # return whatever render is supposed to do
        render conn, "show.html", messenger: messenger
    end
end

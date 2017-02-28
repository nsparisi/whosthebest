defmodule Whosthebest.GameController do
    use Whosthebest.Web, :controller
    
    def index(conn, _params) do
        # get the logged in guest name from the browsing session
        guest_name = get_session(conn, :guest_name)

        # get the logged in user_id from the browsing session
        user_id = get_session(conn, :user_id)
        
        cond do
            # yes, they are logged in
            user_id != nil ->
                # get the full user from the DB
                
                # generate a token based on the user unique id
                token = Phoenix.Token.sign(conn, "user_id", user_id)
                conn = assign(conn, :user_token, token)
                
                # get the user's game_id, so they can join the correct game room
                render conn, "index.html"

            # if they are logged in as a guest
            guest_name != nil ->

                # generate a token for a user_id which we will
                # generate here as a GUID
                guest_user_id = to_string(UUID.uuid4())
                user_token = Phoenix.Token.sign(conn, "user_id", guest_user_id)
                conn = assign(conn, :user_token, user_token)

                # generate a token based on the guest name
                guest_token = Phoenix.Token.sign(conn, "guest_name", guest_name)
                conn = assign(conn, :guest_token, guest_token)
                
                # get the user's game_id, so they can join the correct game room
                render conn, "index.html"

             # if they are not logged in, redirect to login page
            true ->
                conn
                |> put_flash(:error, "Must be logged in to play.")
                |> redirect(to: page_path(conn, :index))
        end
    end
end

defmodule Whosthebest.GameChannel do
    use Phoenix.Channel
    alias Whosthebest.Debug
    alias Whosthebest.GameManager
    alias Whosthebest.GameServer
  
    # **************************
    # Handle JOINs
    # A user will join a specific game ID.
    def join("game:" <> game_id, _params, socket) do
        
        # We have their user ID from socket.connect, so
        # use that to retrieve their DB info
        user_id = socket.assigns[:user_id]
        user = Whosthebest.Repo.get(Whosthebest.User, user_id) 
        
        # and validate that they entered the right room
        case user.last_game_id == game_id do
            true ->
                :timer.send_interval(5000, :ping)
                socket = setup_game(game_id, socket)
                send(self, {:after_join, %{user: user.name, from: user_id}})
                {:ok, socket}
            false ->
                {:error, %{reason: "unauthorized"}}
        end
    end
    
    defp setup_game(game_id, socket) do
        game = GameManager.get_or_create_game(GameManager, game_id)
        assign(socket, :game, game)
    end
    
    # broadcasts to other members of channel
    def handle_info({:after_join, message}, socket) do
        broadcast_from! socket, "user_joined", message
        {:noreply, socket}
    end
    
    # **************************
    # Handle INs
    
    # "game:ready" is called when the client is finished 
    # loading game assets and page is fully loaded.
    def handle_in("game:ready", %{}, socket) do
        Debug.log "GameChannel game:ready " <> to_string(socket.assigns[:user_id])
        game = socket.assigns[:game]
        GameServer.join_user(game, to_string(socket.assigns[:user_id]))
        
        if :ready == GameServer.get_game_state(game) do
            broadcast! socket, "game:ready", %{}
        end
        
        {:noreply, socket}
    end
    
    # "game:frame" is called each frame to send the frame data to the server
    def handle_in("game:frame", %{"payload" => payload}, socket) do
        GameServer.handle_message(
            socket.assigns[:game], 
            to_string(socket.assigns[:user_id]), 
            payload)
    end
    
    # "game:end" is called when the game is over.
    # TODO at some point this will be determined by the server, not client
    def handle_int("game:end", %{}, socket) do
        Debug.log "GameChannel game:end " <> to_string(socket.assigns[:user_id])
        broadcast! socket, "game:end", %{}
    end
    
    # **************************
    # Handle OUTs
    # This is unused for now, since I learned about broadcast_from
    #intercept ["user_joined"]
    #def handle_out("user_joined", message, socket) do
    #    # ignore messages sent from ourself
    #    user_id = socket.assigns[:user_id]
    #    if(message.from == user_id) do
    #        {:noreply, socket}
    #    else
    #        push socket, "user_joined", %{user: message.user}
    #        {:noreply, socket}
    #    end
    #end
    
    # **************************
    # Handle Terminations
    # TODO according to documentation in channel.ex
    # we should have another process that is monitoring this one
    # terminate will not reliably be called
    def terminate(_reason, _socket) do
        
    end
  
    # this is called in join(), set to be run on an interval
    def handle_info(:ping, socket) do
        Debug.log socket.assigns[:user_id]
        broadcast! socket, "broadcast", %{user: socket.assigns[:user_id]}
        {:noreply, socket}
    end
end

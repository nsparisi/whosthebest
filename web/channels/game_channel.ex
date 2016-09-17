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
                socket = assign(socket, :game_id, game_id)
                socket = setup_game(game_id, socket)
                send(self, {:after_join, %{user: user.username, from: user_id}})
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
        broadcast_from! socket, "game:joined", message
        {:noreply, socket}
    end
    
    # **************************
    # Handle INs
    
    # "game:ready" is called when the client is finished 
    # loading game assets and page is fully loaded.
    def handle_in("game:ready", %{}, socket) do
        Debug.log "GameChannel IN game:ready  #{socket.assigns[:user_id]}"
        game = socket.assigns[:game]
        GameServer.join_user(game, to_string(socket.assigns[:user_id]))
        GameServer.clear_frames(game)
        
        if :ready == GameServer.get_game_state(game) do
            :random.seed(:erlang.now())
            random_seed = to_string(:random.uniform() * 1000000)
            broadcast! socket, "game:ready", %{:random_seed => random_seed}
        end
        
        {:noreply, socket}
    end
    
    # "game:frame" is called each frame to send the frame data to the server
    def handle_in("game:frame", %{"payload" => payload}, socket) do
        case GameServer.handle_message(
            socket.assigns[:game], 
            to_string(socket.assigns[:user_id]), 
            payload) 
        do
            :ok ->
                {:noreply, socket}
            {:broadcast, to_client_payload} ->
                broadcast! socket, "game:frame", %{:payload => to_client_payload}
                {:noreply, socket}
        end
    end
    
    # "game:end" is called when the game is over.
    # TODO at some point this will be determined by the server, not client
    def handle_in("game:end", %{}, socket) do
        Debug.log "GameChannel IN game:end  #{socket.assigns[:user_id]}"
        GameServer.reset(socket.assigns[:game])
        broadcast! socket, "game:end", %{}
        {:noreply, socket}
    end
    
    # **************************
    # Handle OUTs
    intercept ["game:ready", "game:frame"]
    
    # game:ready - sends a "ready" notification to clients
    # we are intercepting here to add a user_index, so players
    # will know what player they are!
    # message: %{"random_seed"}
    # push: %{"random_seed", "user_index"}
    def handle_out("game:ready", message, socket) do
        user_index = GameServer.get_user_index(
            socket.assigns[:game], 
            to_string(socket.assigns[:user_id]))
        push socket, "game:ready", %{
            "random_seed" => message.random_seed, 
            "user_index" => user_index}
        {:noreply, socket}
    end

    # game:frame - send game frame data back to client
    # we are intercepting here to add a timestamp
    # message: %{"payload"}
    # push: %{"payload", "out_timestamp"}
    def handle_out("game:frame", message, socket) do
        push socket, "game:frame", %{
            "payload" =>  message.payload, 
            "out_time" => :os.system_time(:milli_seconds)}
        {:noreply, socket}
    end
    
    # **************************
    # Handle Terminations
    # TODO according to documentation in channel.ex
    # we should have another process that is monitoring this one
    # terminate will not reliably be called
    def terminate(_reason, _socket) do
        
    end
end

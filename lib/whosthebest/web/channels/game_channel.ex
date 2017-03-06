defmodule Whosthebest.Web.GameChannel do
    use Phoenix.Channel
    alias Whosthebest.Debug
    alias Whosthebest.GameManager
    alias Whosthebest.GameServer
    alias Whosthebest.Match

    # TODO, remove some 0's here
    # max_age: 1209600 is equivalent to two weeks in seconds
    @max_game_token_age 120960000
  
    # **************************
    # Handle JOINs
    # A user will join a specific game ID.
    def join("g:" <> game_id, params, socket) do
        
        # We have their user ID from socket.connect, so
        # use that to retrieve their DB info
        user_id = socket.assigns[:user_id]
        username = socket.assigns[:username]
        game_token = params["game_token"]
        Debug.log "GameChannel JOIN game:#{game_id} | user_id #{user_id} | username #{username} | game_token #{game_token}"

        # if the user wants to play here they will have game_token defined
        # validate the game_token is for the correct room
        # then, setup the game for this user and save the socket details
        {success, socket} =
            if game_token != nil do
                case Phoenix.Token.verify(socket, "game_id", game_token, max_age: @max_game_token_age) do
                    {:ok, verified_game_id} ->
                        if verified_game_id == game_id do
                            socket = assign(socket, :game_id, game_id)
                            socket = setup_game(game_id, socket)
                            {true, socket}
                        else
                            {false, socket}
                        end
                    {:error, _reason} -> {false, socket}
                end
            else
                {false, socket}
            end

        if success do
            {:ok, socket}
        else
            {:error, %{reason: "unauthorized"}}
        end
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
            random_seed = to_string(:rand.uniform 1000000)
            broadcast! socket, "game:ready", %{:random_seed => random_seed}
        end
        
        {:noreply, socket}
    end
    
    # "f" was formerly "game:frame"
    # "p" was formerly "payload"
    # is called each frame to send the frame data to the server
    def handle_in("f", %{"p" => payload}, socket) do
        if Process.alive? socket.assigns[:game] do
            case GameServer.handle_message(
                socket.assigns[:game], 
                to_string(socket.assigns[:user_id]), 
                payload) 
            do
                :ok -> nil
                {:broadcast, to_client_payload} ->
                    broadcast! socket, "f", %{:payload => to_client_payload}
            end
        end

        {:noreply, socket}
    end
    
    # "game:end" is called when the game is over.
    # TODO at some point this will be determined by the server, not client
    def handle_in("game:end", %{"winner_index" => winner_index, "game_time" => game_time}, socket) do
        Debug.log "GameChannel IN game:end  #{socket.assigns[:user_id]}"

        # translate the winner_id from it's index
        winner_id = GameServer.get_user_from_index(socket.assigns[:game], winner_index)
        Debug.log "GameChannel IN game:end  --winner_index-- #{inspect winner_index}  --winner_id--  #{inspect winner_id}"

        # record game stats as part of match data
        all_users = GameServer.get_users(socket.assigns[:game])
        Debug.log "GameChannel IN game:end --all_users--  #{inspect all_users}"
        update_match_post_game(all_users, winner_id, game_time)

        # the game is over, kill the game server
        kill_game(socket)
        broadcast! socket, "game:end", %{:winner_index => winner_index}
        {:noreply, socket}
    end
    
    # **************************
    # Handle OUTs
    intercept ["game:ready", "f"]
    
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

    # "f" was formerly "game:frame"
    # "p" was formerly "payload"
    # "t" was formerly "out_time"
    # send game frame data back to client
    # we are intercepting here to add a timestamp
    # message: %{"payload"}
    # push: %{"p", "t"}
    def handle_out("f", message, socket) do
        push socket, "f", %{
            "p" =>  message.payload, 
            "t" => :os.system_time(:milli_seconds)}
        {:noreply, socket}
    end
    
    # **************************
    # Handle Terminations
    # TODO according to documentation in channel.ex
    # we should have another process that is monitoring this one
    # terminate will not reliably be called
    def terminate(_reason, _socket) do
        
    end

    
    # **************************
    # private functions
    defp setup_game(game_id, socket) do
        game = GameManager.get_or_create_game(GameManager, game_id)
        assign(socket, :game, game)
    end

    defp kill_game(socket) do
        GameManager.kill_game(GameManager, socket.assigns[:game_id])
    end
    
    defp update_match_post_game(user_ids, winner_id, game_time) do
        changeset = Match.changeset_postgame(%Match{}, user_ids, winner_id, game_time)
        case Whosthebest.Repo.insert(changeset) do
            {:ok, _match} ->
                Debug.log "insert match data was successful. #{inspect changeset}"
            {:error, _changeset} ->
                Debug.log "insert match data was NOT successful. #{inspect changeset}"
        end
    end
end

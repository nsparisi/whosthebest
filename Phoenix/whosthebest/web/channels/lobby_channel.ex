defmodule Whosthebest.LobbyChannel do
    use Phoenix.Channel
    alias Whosthebest.Debug
  
    # **************************
    # Handle JOINs
    def join("lobby:main", _params, socket) do
        
        # We have their user ID from socket.connect, so
        # use that to retrieve their DB info
        user_id = socket.assigns[:user_id]
        user = Whosthebest.Repo.get(Whosthebest.User, user_id) 

        # After joining (leave the function) 
        # broadcast to the channel you're online.
        send(self, {:after_join, %{user: user.username, from: user_id}})

        # Always return OK
        {:ok, socket}
    end

    def join("lobby:" <> _private_subtopic, _message, _socket) do
        {:error, %{reason: "unauthorized"}}
    end
    
    # broadcasts to other members of channel
    def handle_info({:after_join, message}, socket) do
        broadcast_from! socket, "lobby:online", message
        {:noreply, socket}
    end
    
    # **************************
    # Handle INs

    # lobby:message is a basic lobby chat message
    def handle_in("lobby:message", %{"message" => message}, socket) do
        from_id = socket.assigns[:user_id]
        Debug.log "LobbyChannel IN lobby:message #{from_id} | #{message}"

        # Boardcast the message to everyone in the lobby
        broadcast! socket, "lobby:message", %{"from_id" => from_id, "message" => message}

        {:noreply, socket}
    end

    # lobby:ask is a request from the client to play a game against user_id
    def handle_in("lobby:ask", %{"to_id" => to_id}, socket) do
        from_id = socket.assigns[:user_id]
        Debug.log "LobbyChannel IN lobby:ask #{from_id} | #{to_id}"
        
        # Broadcast the ask, then add an INTERCEPT, to filter who actually pushes.
        # TODO - run some checks to see if ask is even possible (user is in a game?)
        broadcast! socket, "lobby:ask", %{"from_id" => from_id, "to_id" => to_id}
        
        {:noreply, socket}
    end
    
    # lobby:response is the reponse from the client, 
    # whether they have accepted or declined to invitation to play a game
    def handle_in("lobby:response", %{"to_id" => to_id, "accepted" => accepted }, socket) do
        from_id = socket.assigns[:user_id]
        Debug.log "LobbyChannel IN lobby:response #{accepted} | to #{to_id} | from #{from_id}"

        if(accepted) do
            game_id = UUID.uuid4()
            broadcast! socket, "lobby:start_game", %{"from_id" => from_id, "to_id" => to_id, "game_id" => game_id}
        else
            broadcast_from! socket, "lobby:response", %{"from_id" => from_id, "to_id" => to_id, "accepted" => accepted}
        end

        {:noreply, socket}
    end
    
    # **************************
    # Handle OUTs

    # lobby:message - send a chat message to the lobby
    # message: %{"from_id", "message"}
    # push: %{"from_id", "message"}
    intercept ["lobby:message"]
    def handle_out("lobby:message", message, socket) do
        user_id = socket.assigns[:user_id]
        Debug.log "LobbyChannel OUT lobby:message #{user_id} | from #{message.from_id} | from #{message.to_id}"

        # Push the message
        push socket, "lobby:message", %{"from_id" =>  message.from_id, "message" => message.message}

        {:noreply, socket}
    end

    # lobby:ask - prompts the to_id if they want to play a game
    # message: %{"from_id", "to_id"}
    # push: %{"from_id", "to_id"}
    intercept ["lobby:ask"]
    def handle_out("lobby:ask", message, socket) do
        user_id = socket.assigns[:user_id]
        Debug.log "LobbyChannel OUT lobby:ask #{user_id} | from #{message.from_id} | to #{message.to_id}"

        # Push the message, only if we're being spoken to.
        if(message.to_id == user_id) do
            push socket, "lobby:ask", %{"from_id" =>  message.from_id, "to_id" => message.to_id}
        end

        {:noreply, socket}
    end

    # lobby:response - notifies the to_id that the from_id has responded
    # message: %{"from_id", "to_id", "accepted"}
    # push: %{"from_id", "to_id", "accepted"}
    intercept ["lobby:response"]
    def handle_out("lobby:response", message, socket) do
        user_id = socket.assigns[:user_id]
        Debug.log "LobbyChannel OUT lobby:response to #{user_id} | from #{message.from_id}"

        # Push the message, only if we're being spoken to.
        if(message.to_id == user_id) do
            push socket, "lobby:response", %{"from_id" => message.from_id, "to_id" => message.to_id, "accepted" => message.accepted}
        end

        {:noreply, socket}
    end

    # lobby:start_game - notifies to_id and from_id that they should enter a match
    # message: %{"from_id", "to_id", "game_id"}
    # push: %{"from_id", "to_id", "game_id"}
    intercept ["lobby:start_game"]
    def handle_out("lobby:start_game", message, socket) do
        user_id = socket.assigns[:user_id]
        Debug.log "LobbyChannel OUT lobby:start_game to #{user_id} | from #{message.from_id} | from #{message.to_id} | from #{message.game_id}"

        # Push the message, only if we're being spoken to.
        if(message.to_id == user_id || message.from_id == user_id) do
            push socket, "lobby:start_game", %{"from_id" => message.from_id, "to_id" => message.to_id, "game_id" => message.game_id}
        end

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

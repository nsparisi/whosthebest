defmodule Whosthebest.LobbyChannel do
    use Phoenix.Channel
    alias Whosthebest.Presence
    alias Whosthebest.Debug
  
    # **************************
    # Handle JOINs
    def join("lobby:main", _params, socket) do
        
        # We have their user ID from socket.connect, so
        # use that to retrieve their DB info
        user_id = socket.assigns[:user_id]
        username = socket.assigns[:username]

        # mark the user as "available" for game invites
        socket = assign(socket, :is_available, true)

        # After joining (leave the function) 
        # broadcast to the channel you're online.
        #send(self, {:setup_presence, %{user: user.username, from: user_id}})
        send self, :setup_presence

        # Always return OK
        {:ok, %{user_id: user_id, username: username}, socket}
    end

    def join("lobby:" <> _private_subtopic, _message, _socket) do
        {:error, %{reason: "unauthorized"}}
    end
    
    # :setup_presence after a user has joined
    # this will set up Presence to track the connection state of the user
    def handle_info(:setup_presence, socket) do
        user_id = socket.assigns[:user_id]
        username = socket.assigns[:username]
        online_at = inspect(System.system_time(:seconds))
        Debug.log ":setup_presence #{user_id} | #{online_at}"
        
        # the presence_state event will contain all connected users 
        # whenever there is a change in presence, the presence_diff event will convey the delta info of users.
        {:ok, _} = Presence.track(socket, user_id,  %{online_at: online_at, username: username})
        push socket,"presence_state", Presence.list(socket)

        #broadcast_from! socket, "lobby:online", message
        #Process.send_after(self, :update_presence, 5000)
        {:noreply, socket}
    end

    # :update_presence is called on an interval
    # this will update the state of the Presence of connected users 
    def handle_info(:update_presence, socket) do
        user_id = socket.assigns[:user_id]
        username = socket.assigns[:username]
        online_at = inspect(System.system_time(:seconds))
        Debug.log ":update_presence #{user_id} | #{online_at}"
        
        Presence.update(socket, user_id, %{online_at: online_at, username: username})
        Process.send_after(self, :update_presence, 5000)
        {:noreply, socket}
    end
    
    # **************************
    # Handle INs

    # lobby:message is a basic lobby chat message
    def handle_in("lobby:message", %{"message" => message}, socket) do
        from_id = socket.assigns[:user_id]
        Debug.log "LobbyChannel IN lobby:message #{from_id} | #{message}"

        # Boardcast the message to everyone in the lobby
        broadcast! socket, "lobby:message", %{
            from_id: to_string(from_id), 
            message: message}

        {:noreply, socket}
    end

    # lobby:ask is a request from the client to play a game against user_id
    def handle_in("lobby:ask", %{"to_id" => to_id}, socket) do
        from_id = socket.assigns[:user_id]
        is_available = socket.assigns[:is_available]
        Debug.log "LobbyChannel IN lobby:ask #{from_id} | #{to_id} | #{is_available}"

        if(is_available) do
            # Broadcast the ask, then add an INTERCEPT, to filter who actually pushes.
            # TODO - run some checks to see whether ask is even possible (user is in a game?)
            broadcast! socket, "lobby:ask", %{
                from_id: to_string(from_id), 
                to_id: to_string(to_id) }
        end

        # the user is now "busy",
        # and is blocked from future game invites
        socket = assign(socket, :is_available, false)

        {:noreply, socket}
    end
    
    # lobby:response is the reponse from the client, 
    # whether they have accepted or declined to invitation to play a game
    def handle_in("lobby:response", %{"to_id" => to_id, "accepted" => accepted }, socket) do
        from_id = socket.assigns[:user_id]
        Debug.log "LobbyChannel IN lobby:response #{accepted} | to #{to_id} | from #{from_id}"

        if(accepted) do
            # Start a new game between these two users
            game_id = UUID.uuid4()

            # Let each player know the game has started
            broadcast!  socket, "lobby:start_game", %{
                from_id: to_string(from_id), 
                to_id: to_string(to_id), 
                game_id: game_id}
        else
            # Let the player know the invitation was declined
            broadcast! socket, "lobby:response", %{
                from_id: to_string(from_id), 
                to_id: to_string(to_id), 
                accepted: accepted}
        end

        {:noreply, socket}
    end
    
    # **************************
    # Handle OUTs
    intercept ["lobby:message", "lobby:ask", "lobby:response", "lobby:start_game"]

    # lobby:message - send a chat message to the lobby
    # message: %{"from_id", "message"}
    # push: %{"from_id", "message"}
    def handle_out("lobby:message", message, socket) do
        user_id = to_string(socket.assigns[:user_id])
        Debug.log "LobbyChannel OUT lobby:message #{user_id} from #{message.from_id} | #{message.message}"

        # Push the message
        push socket, "lobby:message", %{"from_id" =>  message.from_id, "message" => message.message}

        {:noreply, socket}
    end

    # lobby:ask - prompts the to_id if they want to play a game
    # message: %{"from_id", "to_id"}
    # push: %{"from_id", "to_id"}
    def handle_out("lobby:ask", message, socket) do
        user_id = to_string(socket.assigns[:user_id])
        is_available = socket.assigns[:is_available]
        Debug.log "LobbyChannel OUT lobby:ask #{user_id} | from #{message.from_id} | to #{message.to_id}"

        # Push the message, only if we're being spoken to.
        # And only if we're available for an invite
        if(message.to_id == user_id) do
            if(is_available) do
                push socket, "lobby:ask", %{"from_id" =>  message.from_id, "to_id" => message.to_id}
            else
                # respond back that the user is busy
                # use _from here, so we avoid being notified
                broadcast_from! socket, "lobby:response", %{
                    from_id: to_string(message.to_id), 
                    to_id: to_string(message.from_id), 
                    accepted: false}
            end
        end

        # update the socket, in all cases this user is now "busy"
        socket = 
            if(message.to_id == user_id) do
                assign(socket, :is_available, false)
            else
                socket
            end

        {:noreply, socket}
    end

    # lobby:response - notifies the to_id that the from_id has responded
    # message: %{"from_id", "to_id", "accepted"}
    # push: %{"from_id", "to_id", "accepted"}
    def handle_out("lobby:response", message, socket) do
        user_id = to_string(socket.assigns[:user_id])
        Debug.log "LobbyChannel OUT lobby:response #{user_id} from #{message.from_id} | to #{message.to_id}"

        # If we're being spoken to,
        # update the socket, the user is now unblocked for game invites
        socket = 
            if(!message.accepted && (message.to_id == user_id || message.from_id == user_id)) do
                assign(socket, :is_available, true)
            else
                socket
            end

        # If we're being spoken to,
        # push the message out to the client.
        if(message.to_id == user_id || message.from_id == user_id) do
            push socket, "lobby:response", %{"from_id" => message.from_id, "to_id" => message.to_id, "accepted" => message.accepted}
        end

        {:noreply, socket}
    end

    # lobby:start_game - notifies to_id and from_id that they should enter a match
    # message: %{"from_id", "to_id", "game_id"}
    # push: %{"from_id", "to_id", "game_id", "game_token"}
    def handle_out("lobby:start_game", message, socket) do
        user_id = to_string(socket.assigns[:user_id])
        Debug.log "LobbyChannel OUT lobby:start_game #{user_id} from #{message.from_id} | to #{message.to_id} | game_id #{message.game_id}"

        # Push the message, only if we're being spoken to.
        if(message.to_id == user_id || message.from_id == user_id) do

            # sign the game_id so we can make proper validation checks for this user
            # and that they are joining the right game room
            game_token = Phoenix.Token.sign(socket, "game_id", message.game_id)

            push socket, "lobby:start_game", 
                %{"from_id" => message.from_id, 
                "to_id" => message.to_id, 
                "game_id" => message.game_id, 
                "game_token" => game_token}
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

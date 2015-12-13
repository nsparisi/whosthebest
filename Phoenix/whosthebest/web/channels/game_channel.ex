defmodule Whosthebest.GameChannel do
    use Phoenix.Channel
    alias Whosthebest.Debug
  
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
                send(self, {:after_join, %{user: user.name, from: user_id}})
                {:ok, socket}
            false ->
                {:error, %{reason: "unauthorized"}}
        end
    end
    
    # broadcasts to other members of channel
    def handle_info({:after_join, message}, socket) do
        broadcast_from! socket, "user_joined", message
        {:noreply, socket}
    end
    
    # **************************
    # Handle INs
    def handle_in("msg", %{"body" => body}, socket) do
        broadcast! socket, "new_msg", %{body: body}
        {:noreply, socket}
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

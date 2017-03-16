defmodule Whosthebest.Web.GameSocket do
    use Phoenix.Socket
    import Ecto.Repo

    ## Channels
    # "g:" is formerly "game:", shortened to reduce network traffic
    channel "g:*", Whosthebest.Web.GameChannel
    channel "lobby:*", Whosthebest.Web.LobbyChannel

    ## Transports
    transport :websocket, Phoenix.Transports.WebSocket,
      serializer: Whosthebest.Web.Transports.MessagePackSerializer
    # transport :longpoll, Phoenix.Transports.LongPoll

    # max_age: This token is acquired on page load, 
    # so it should be consumed in less than a few seconds.
    @max_token_age 60

    # Socket params are passed from the client and can
    # be used to verify and authenticate a user. After
    # verification, you can put default assigns into
    # the socket that will be set for all channels, ie
    #
    #         {:ok, assign(socket, :user_id, verified_user_id)}
    #
    # To deny connection, return `:error`.
    #
    # See `Phoenix.Token` documentation for examples in
    # performing token verification on connect.
    def connect(%{"user_token" => user_token, "guest_token" => guest_token }, socket) do   

        # verify the user token is valid and not expired
        case Phoenix.Token.verify(socket, "user_id", user_token, max_age: @max_token_age) do
        {:ok, verified_user_id} ->
                   
            # we now have the user_id, add it to the socket details
            socket = assign(socket, :user_id, verified_user_id)

            # if the user is a guest, in the same manner, validate the guest
            if guest_token != "" do
                case Phoenix.Token.verify(socket, "guest_name", guest_token, max_age: @max_token_age) do
                {:ok, verified_guest_name} ->

                    # we now have the guest_name, add it to the socket details
                    socket = assign(socket, :username, verified_guest_name  <> " (Guest)")
                    socket = assign(socket, :is_guest, true)
                    {:ok, socket}
                    
                {:error, _reason} ->
                    # return error, if guest token is bad
                    :error
                end
            else
                # retrieve the actual username from the db and assign to the socket
                user = Whosthebest.Repo.get(Whosthebest.User, verified_user_id) 
                socket = assign(socket, :username, user.username)
                socket = assign(socket, :is_guest, false)
                {:ok, socket}
            end

        {:error, _reason} ->
            # return error, if user token is bad
            :error
        end
    end
    
    def connect(_params, _socket) do
        :error
    end

    # Socket id's are topics that allow you to identify all sockets for a given user:
    #
    #     def id(socket), do: "users_socket:#{socket.assigns.user_id}"
    #
    # Would allow you to broadcast a "disconnect" event and terminate
    # all active sockets and channels for a given user:
    #
    #     Whosthebest.Web.Endpoint.broadcast("users_socket:" <> user.id, "disconnect", %{})
    #
    # Returning `nil` makes this socket anonymous.
    def id(_socket), do: nil
end

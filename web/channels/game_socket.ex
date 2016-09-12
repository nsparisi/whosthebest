defmodule Whosthebest.GameSocket do
  use Phoenix.Socket
  alias Whosthebest.Debug
  import Ecto.Repo

  ## Channels
  channel "game:*", Whosthebest.GameChannel
  channel "lobby:*", Whosthebest.LobbyChannel

  ## Transports
  transport :websocket, Phoenix.Transports.WebSocket
  # transport :longpoll, Phoenix.Transports.LongPoll

  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error`.
  #
  # See `Phoenix.Token` documentation for examples in
  # performing token verification on connect.
  def connect(%{"user_token" => token}, socket) do  
    # TODO, remove some 0's here
    # max_age: 1209600 is equivalent to two weeks in seconds
    case Phoenix.Token.verify(socket, "user_id", token, max_age: 120960000) do
        {:ok, verified_user_id} ->            
            # add relevant info to the socket
            socket = assign(socket, :user_id, verified_user_id)            
            {:ok, socket}
        {:error, _reason} ->
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
  #     Whosthebest.Endpoint.broadcast("users_socket:" <> user.id, "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  def id(_socket), do: nil
end
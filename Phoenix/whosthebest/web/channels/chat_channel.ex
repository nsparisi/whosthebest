defmodule Whosthebest.ChatChannel do
  use Phoenix.Channel

  def join("chat:lobby", _message, socket) do
    {:ok, socket}
  end
  
  def join("chat:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end
end

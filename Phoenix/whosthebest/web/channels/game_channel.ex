defmodule Whosthebest.GameChannel do
  use Phoenix.Channel

  def join("game:play", _message, socket) do
    {:ok, socket}
  end
  
  def join("game:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end
end

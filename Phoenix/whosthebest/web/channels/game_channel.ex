defmodule Whosthebest.GameChannel do
  use Phoenix.Channel

  def join("game:play", _message, socket) do
    {:ok, socket}
  end
  
  def join("game:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end
  
  def debug(message) do
    as_string = to_string(message)
    IO.inspect "[**GameChannel**] " <> as_string
  end
end

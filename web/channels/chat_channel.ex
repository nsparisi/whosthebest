defmodule Whosthebest.ChatChannel do
  use Phoenix.Channel
  require Logger

  def join("chat:lobby", message, socket) do
    :timer.send_interval(5000, :ping)
    send(self, {:after_join, message})
    {:ok, socket}
  end
  
  def join("chat:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end
  
  def handle_in("new_msg", %{"body" => body, "user" => user}, socket) do
    broadcast! socket, "new_msg", %{body: user <> ":" <> body}
    {:noreply, socket}
  end
  
  def handle_out("new_msg", payload, socket) do
    push socket, "new_msg", payload
    {:noreply, socket}
  end
  
  def handle_info({:after_join, _msg}, socket) do
    broadcast! socket, "new_msg", %{body: "Welcome to the Lobby! "}
    # broadcast! socket, "user:entered", %{user: msg["user"]}
    push socket, "join", %{status: "connected"}
    {:noreply, socket}
  end
  
  def handle_info(:ping, socket) do
    push socket, "new_msg", %{user: "SYSTEM", body: "ping"}
    {:noreply, socket}
  end
  
end

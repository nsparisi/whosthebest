# file: web/transports/message_pack_serializer.ex

# 
# Taken from Phoenix.Transports.WebSocketSerializer for inspiration.
#
defmodule Whosthebest.Web.Transports.MessagePackSerializer do  
  @moduledoc false

  @behaviour Phoenix.Transports.Serializer

  alias Phoenix.Socket.Reply
  alias Phoenix.Socket.Message
  alias Phoenix.Socket.Broadcast

  @doc """
  Translates a `Phoenix.Socket.Broadcast` into a `Phoenix.Socket.Message`.
  MessagePack cannot digest the Message struct directly and requires a plain map instead.
  """
  def fastlane!(%Broadcast{} = msg) do
    {:socket_push, :binary, MessagePack.pack!(%{
      topic: msg.topic,
      event: msg.event,
      payload: msg.payload
    }, enable_string: true)}
  end

  @doc """
  Encodes a `Phoenix.Socket.Message` struct to a MsgPack binary.
  MessagePack cannot digest the Message struct directly and requires a plain map instead.
  """
  def encode!(%Reply{} = reply) do
    {:socket_push, :binary, MessagePack.pack!(%{
        topic: reply.topic,
        event: "phx_reply",
        ref: reply.ref,
        payload: %{status: reply.status, response: reply.payload}
      },enable_string: true) }
  end
  def encode!(%Message{} = msg) do
    {:socket_push, :binary, MessagePack.pack!((Map.from_struct msg), enable_string: true)}
  end

  @doc """
  Decodes MsgPack binary(string?) into `Phoenix.Socket.Message` struct.
  """
  def decode!(message, _opts) do
    message
    |> MessagePack.unpack!(enable_string: true)
    |> Phoenix.Socket.Message.from_map!()
  end
end
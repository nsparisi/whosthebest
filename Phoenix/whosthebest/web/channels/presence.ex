defmodule Whosthebest.Presence do
    use Phoenix.Presence, 
        otp_app: :whosthebest, 
        pubsub_server: Whosthebest.PubSub
end
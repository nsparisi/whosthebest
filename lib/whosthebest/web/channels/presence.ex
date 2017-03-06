defmodule Whosthebest.Web.Presence do
    use Phoenix.Presence, 
        otp_app: :whosthebest, 
        pubsub_server: Whosthebest.PubSub

    # import Ecto.Query
    # alias Whosthebest.Debug

    # def fetch(_topic, entries) do
    #     query =
    #         from u in Whosthebest.User,
    #             where: u.id in ^Map.keys(entries),
    #             select: {u.id, u.username}
    #     users = query |> Whosthebest.Repo.all |> Enum.into(%{})
    #     for {key, %{metas: metas}} <- entries, into: %{} do
              #doesn't work: key is a string, but needs to be an integer
    #         {key, %{metas: metas, user: users[key]}}
    #     end
    # end

    # def fetch(_topic, entries) do
    #     for {key, %{metas: metas}} <- entries, into: %{} do
    #         {key, %{metas: metas, user: %{name: "chris"}}}
    #     end
    # end
end
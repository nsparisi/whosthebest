defmodule Whosthebest.Repo do
  use Ecto.Repo, otp_app: :whosthebest,
  adapter: Ecto.Adapters.Postgres
end

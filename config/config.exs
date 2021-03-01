# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

config :whosthebest, 
  ecto_repos: [Whosthebest.Repo]

# Configures the endpoint
config :whosthebest, Whosthebest.Web.Endpoint,
  url: [host: "localhost"],
  root: Path.dirname(__DIR__),
  secret_key_base: "ywwiA+aZchK68s3jLWrS7u9Cw6RChvOCZcL7kNPO+hM90a3OawEhR2JjB3o3cBxa",
  render_errors: [view: HelloWeb.ErrorView, accepts: ~w(html json), layout: false],
  pubsub_server: Whosthebest.PubSub,
  live_view: [signing_salt: "UCkf3we4"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
import_config "mail.secret.exs"
import_config "recaptcha.secret.exs"
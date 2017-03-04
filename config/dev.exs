use Mix.Config

# For development, we disable any cache and enable
# debugging and code reloading.
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we use it
# with brunch.io to recompile .js and .css sources.
config :whosthebest, Whosthebest.Endpoint,
  http: [port: 4000],
  debug_errors: true,
  code_reloader: true,
  check_origin: false,
  watchers: [node: ["node_modules/brunch/bin/brunch", "watch", "--stdin",
           cd: Path.expand("../", __DIR__)]]

# Watch static and templates for browser reloading.
config :whosthebest, Whosthebest.Endpoint,
  live_reload: [
    patterns: [
      # I removed all of these watchers as a workaround for a bug where static assets were 404-ing.
      # **You can still see changes "live" by refreshing manually**
      # An error was being thrown in Phoenix.CodeReloader.Server at lib/phoenix/code_reloader/server.ex:112.
      # I noticed this code path was being hit 3-times in total for a single page refresh on the /game page.
      # 2 times is expected (dont know why), but the 3rd instance was happening in-between and causing 
      # a race condition for file write permissions.
    ]
  ]

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Set a higher stacktrace during development.
# Do not configure such in production as keeping
# and calculating stacktraces is usually expensive.
config :phoenix, :stacktrace_depth, 20

# Configure your database
config :whosthebest, Whosthebest.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: "postgres",
  password: "postgres",
  database: "whosthebest_dev",
  hostname: "localhost",
  pool_size: 10

use Mix.Config

# Configure your database
config :whosthebest, Whosthebest.Repo,
  username: "postgres",
  password: "postgres",
  database: "whosthebest_dev",
  hostname: "localhost",
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# For development, we disable any cache and enable
# debugging and code reloading.
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we use it
# with brunch.io to recompile .js and .css sources.
config :whosthebest, Whosthebest.Web.Endpoint,
  http: [port: 4000],
  debug_errors: true,
  code_reloader: true,
  check_origin: false,
  watchers: [
    node: [
      "node_modules/webpack/bin/webpack.js", 
      "--mode", 
      "development",
      "--watch-stdin",
      cd: Path.expand("../assets", __DIR__)
    ]
  ]

# ## SSL Support
#
# In order to use HTTPS in development, a self-signed
# certificate can be generated by running the following
# Mix task:
#
#     mix phx.gen.cert
#
# Note that this task requires Erlang/OTP 20 or later.
# Run `mix help phx.gen.cert` for more information.
#
# The `http:` config above can be replaced with:
#
#     https: [
#       port: 4001,
#       cipher_suite: :strong,
#       keyfile: "priv/cert/selfsigned_key.pem",
#       certfile: "priv/cert/selfsigned.pem"
#     ],
#
# If desired, both `http:` and `https:` keys can be
# configured to run both http and https servers on
# different ports.

# Watch static and templates for browser reloading.
config :whosthebest, Whosthebest.Web.Endpoint,
  live_reload: [
    patterns: [
      # I removed all of these watchers as a workaround for a bug where static assets were 404-ing.
      # **You can still see changes "live" by refreshing manually**
      # An error was being thrown in Phoenix.CodeReloader.Server at lib/phoenix/code_reloader/server.ex:112.
      # I noticed this code path was being hit 3-times in total for a single page refresh on the /game page.
      # 2 times is expected (dont know why), but the 3rd instance was happening in-between and causing 
      # a race condition for file write permissions.
      
      #~r"priv/static/.*(js|css|png|jpeg|jpg|gif|svg)$",
      #~r"priv/gettext/.*(po)$",
      #~r"lib/hello_web/(live|views)/.*(ex)$",
      #~r"lib/hello_web/templates/.*(eex)$"
    ]
  ]

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Set a higher stacktrace during development.
# Do not configure such in production as keeping
# and calculating stacktraces is usually expensive.
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

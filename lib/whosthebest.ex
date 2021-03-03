defmodule Whosthebest.Application do
  use Application

  # See http://elixir-lang.org/docs/stable/elixir/Application.html
  # for more information on OTP Applications
  def start(_type, _args) do
    import Supervisor.Spec, warn: false

    children = [
      Whosthebest.Repo,
      {Whosthebest.GameManager, name: Whosthebest.GameManager},
      {Phoenix.PubSub, name: Whosthebest.PubSub},
      Whosthebest.Web.Presence,
      Whosthebest.Web.Telemetry,
      Whosthebest.Web.Endpoint
    ]

    # See http://elixir-lang.org/docs/stable/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Whosthebest.Supervisor]
    Supervisor.start_link(children, opts)
  end
end

defmodule Whosthebest.Plugs.UserSession do
  import Plug.Conn
  alias Whosthebest.Repo
  alias Whosthebest.User

  def init(default), do: default

  def call(conn, _default) do
    if get_session(conn, :user_id) do
      user = Repo.get(User, get_session(conn, :user_id))
      assign(conn, :current_user, user)
    else
      assign(conn, :current_user, nil)
    end
  end
end
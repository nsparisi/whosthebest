defmodule Whosthebest.Web.PageController do
    use Whosthebest.Web, :controller

    alias Whosthebest.User

    def index(conn, _params) do
        render conn, "index.html"
    end

    def guest_login(conn, _params) do
        conn
        |> put_session(:guest_name, User.generate_guest_name)
        |> redirect(to: game_path(conn, :index))
    end
end

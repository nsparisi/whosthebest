defmodule Whosthebest.Web.PageController do
    use Whosthebest.Web, :controller

    alias Whosthebest.User

    @doc """
    The main landing page for the website.
    """
    def index(conn, _params) do
        render conn, "index.html"
    end

    @doc """
    Logs the user in as a guest and redirects directly to the game page.
    The idea is to keep the guest experience short and sweet.
    """
    def guest_login(conn, _params) do
        conn
        |> put_session(:guest_name, User.generate_guest_name)
        |> redirect(to: game_path(conn, :index))
    end
end

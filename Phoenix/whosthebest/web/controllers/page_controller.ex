defmodule Whosthebest.PageController do
  use Whosthebest.Web, :controller
  
    plug Openmaize.Login, [unique_id: :email, redirects: :true] when action in [:login_user]
    plug Openmaize.Logout when action in [:logout]

    def index(conn, _params) do
        render conn, "index.html"
    end

    def login(conn, _params) do
        render conn, "login.html"
    end
end

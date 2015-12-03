defmodule Whosthebest.PageController do
  use Whosthebest.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end

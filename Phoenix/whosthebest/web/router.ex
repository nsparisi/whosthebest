defmodule Whosthebest.Router do
  use Whosthebest.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :put_user_token
  end

  pipeline :api do
    plug :accepts, ["json"]
  end
  
  # interesting, test code -- not sure it belongs here.
  defp put_user_token(conn, _) do
    username = get_session(conn, :username)
    if username do
        conn
    else 
        conn
    end
  end

  scope "/", Whosthebest do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index
    get "/lobby", LobbyController, :index
    get "/game", GameController, :index
    
    get "/users/login/:username", UserController, :login
    get "/users/logout", UserController, :logout
    resources "/users", UserController
  end

  # Other scopes may use custom stacks.
  # scope "/api", Whosthebest do
  #   pipe_through :api
  # end
end

defmodule Whosthebest.Router do
  use Whosthebest.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug Openmaize.Authenticate
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
    get "/login", PageController, :login, as: :login
    post "/login", PageController, :login_user, as: :login
    get "/logout", PageController, :logout, as: :logout
    
    get "/lobby", LobbyController, :index
    get "/game", GameController, :index
  end
  
  scope "/users", Whosthebest do
    pipe_through :browser
    
    resources "/", UserController, only: [:index, :show, :edit, :update]
  end
  
  scope "/admin", Whosthebest do
    pipe_through :browser
    
    get "/", AdminController, :index
    resources "/", AdminController, only: [:new, :create, :delete]
  end
end

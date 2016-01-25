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
  
    scope "/", Whosthebest do
        pipe_through :browser

        # Main landing page for the site.
        # news, faq, etc.
        get "/", PageController, :index
        
        # PageController handles all user registration + login experience
        get "/register", PageController, :register
        post "/create", PageController, :create
        get "/login", PageController, :login, as: :login
        post "/login", PageController, :login_user, as: :login
        get "/logout", PageController, :logout, as: :logout

        # /game will be the one and only game page
        get "/game", GameController, :index
    end
  
    scope "/users", Whosthebest do
        pipe_through :browser

        # This is the landing page for users
        # will contain game-specific news and data.
        resources "/", UserController, only: [:index, :update, :edit], param: "id"
        get "/:username", UserController, :show
        #get "/password", UserController, :password
    end

    scope "/admin", Whosthebest do
        pipe_through :browser

        # /admin will provide admin functions
        get "/", AdminController, :index
        resources "/", AdminController, only: [:delete]
    end
end

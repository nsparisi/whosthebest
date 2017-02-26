defmodule Whosthebest.Router do
    use Whosthebest.Web, :router
    
    pipeline :browser do
        plug :accepts, ["html"]
        plug :fetch_session
        plug :fetch_flash
        plug :protect_from_forgery
        plug :put_secure_browser_headers
        plug Whosthebest.Plugs.UserSession
    end
    
    pipeline :protected do
        plug :accepts, ["html"]
        plug :fetch_session
        plug :fetch_flash
        plug :protect_from_forgery
        plug :put_secure_browser_headers
        plug Whosthebest.Plugs.UserSession
    end
  
    # =========================================
    # public routes - coherence plugin will not
    # require a login for these routes
    scope "/", Whosthebest do
        pipe_through :browser

        # Main landing page for the site.
        # news, faq, etc.
        get "/", PageController, :index
        
        # PageController handles all user registration + login experience
        # /login was commented because we want to reduce the number of clicks to play
        # get "/login", PageController, :login, as: :login
        get "/guest_login", PageController, :guest_login, as: :guest_login

        # /game will be the one and only game page
        get "/game", GameController, :index

        # new, todo, comment
        get "/signin/:token", SessionController, :show, as: :signin
        resources "/sessions", SessionController, only: [:new, :create, :delete]
    end
  
    scope "/users", Whosthebest do
        pipe_through :browser

        # This is the landing page for users
        # will contain game-specific news and data.
        resources "/", UserController, only: [:index, :new, :create]

        # Will also be able to view user profiles
        get "/:username", UserController, :show
    end

    # =========================================
    # private routes - coherence plugin *will*
    # require a login for these routes
    scope "/users", Whosthebest do
        pipe_through :protected

        # Logged in users will be able to edit their profile
        resources "/", UserController, only: [:update, :edit], param: "id"
    end

    scope "/admin", Whosthebest do
        pipe_through :protected

        # /admin will provide admin functions
        get "/", AdminController, :index
        resources "/", AdminController, only: [:delete]
    end
end

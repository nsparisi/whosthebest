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
  
    # =========================================
    # public routes
    scope "/", Whosthebest do
        pipe_through :browser

        # Main landing page for the site.
        # news, faq, etc.
        get "/", PageController, :index
        
        # /guest_login will take you straight to the game with a temp guest name
        get "/guest_login", PageController, :guest_login, as: :guest_login

        # /game will be the one and only game page
        get "/game", GameController, :index

        # the email sent will provide this signing link to log in
        get "/signin/:token", SessionController, :show, as: :signin

        # delete session will let you sign out
        get "/sessions", SessionController, :delete
        
        # commented out: sessions new/create are currently handled by the user controller
        # resources "/sessions", SessionController, only: [:new, :create]
    end
  
    scope "/users", Whosthebest do
        pipe_through :browser

        # /users will provide leaderboards, game info
        # /users/new will let you do passwordless log in and signup
        # /users/create is the POST action from /users/new
        resources "/", UserController, only: [:index, :new, :create]

        # /users/:username will show a public profile for the username
        get "/:username", UserController, :show
    end

    # =========================================
    # private routes
    # for now, there is no difference between public v private routes. the plugs are identical.
    scope "/users", Whosthebest do
        pipe_through :browser

        # Logged in users will be able to edit their profile/username
        # /users/:id/edit is the GET for the edit page, authorized against current user
        # /users/:id/update is the POST action from /users/edit
        resources "/", UserController, only: [:update, :edit], param: "id"
    end

    scope "/admin", Whosthebest do
        pipe_through :browser

        # /admin will provide admin functions
        # TODO this feature is currently disabled in the admin controller
        get "/", AdminController, :index
        resources "/", AdminController, only: [:delete]
    end
end

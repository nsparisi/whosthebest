defmodule Whosthebest.PageController do
    use Whosthebest.Web, :controller
  
    alias Whosthebest.User
    
    # cleans the form data when registering a new user
    plug :scrub_params, "user" when action in [:create]
  
    # authorizes the username/password combo
    # and "logs in" or "logs out" our user in the session
    plug Openmaize.Login, [unique_id: :username, redirects: :true] when action in [:login_user]
    plug Openmaize.Logout when action in [:logout]

    def index(conn, _params) do
        render conn, "index.html"
    end

    def login(conn, _params) do
        render conn, "login.html"
    end
    
    def register(conn, _params) do
        changeset = User.changeset(%User{})
        render conn, "register.html", changeset: changeset
    end
    
    def create(conn, %{"user" => user_params}) do
        changeset = User.auth_changeset(%User{}, user_params)
        case Repo.insert(changeset) do
            {:ok, _user} ->
                conn
                |> put_flash(:info, "User created successfully.")
                |> redirect(to: login_path(conn, :login))
            {:error, changeset} ->
                conn
                |> render("register.html", changeset: changeset)
        end
    end
end

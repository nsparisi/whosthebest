defmodule Whosthebest.PageController do
    use Whosthebest.Web, :controller

    alias Whosthebest.{TokenAuthentication, User}

    def index(conn, _params) do
        render conn, "index.html"
    end

    def login(conn, _params) do
        conn = delete_session conn, :guest_name
        render conn, "login.html"
    end

    def guest_login(conn, %{"guest" => guest_params}) do
        guest_name = guest_params["guest_name"]
        changeset = User.validate_guest(%User{}, guest_name)
        if changeset.valid? do
            conn
            |> put_session(:guest_name, guest_name)
            |> redirect(to: game_path(conn, :index))
        else
            conn 
            |> put_flash(:error, "Invalid guest name")
            |> redirect(to: login_path(conn, :login, guest: guest_params))
        end
    end
    
    @doc """
    Sign up action, most likely UserController#create
    """
    def create(conn, %{"user" => user_params}) do
        changeset = User.changeset(%User{}, user_params)

        case Repo.insert(changeset) do
            {:ok, user} ->
                TokenAuthentication.provide_token(user)

                conn
                |> put_flash(:info, "You signed up successfully. Please check your email.")
                |> redirect(to: page_path(conn, :index))

            {:error, changeset} ->
                render(conn, "new.html", changeset: changeset)
        end
    end
end

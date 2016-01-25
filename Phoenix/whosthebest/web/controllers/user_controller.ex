defmodule Whosthebest.UserController do
    use Whosthebest.Web, :controller
    
    import Openmaize.AccessControl
    alias Whosthebest.User

    plug :scrub_params, "user" when action in [:update]
    
    # users with either admin or user roles can access any resource in this module
    plug :authorize, roles: ["admin", "user"]
    #plug :authorize, [roles: ["admin", "user"]] #when not action in [:create]

    # check current user id for the specified actions
    # remove the show atom to allow other users to view the show page
    plug :authorize_id when action in [:edit, :update]
  
    def index(conn, _params) do
        user = Repo.get!(User, conn.assigns[:current_user][:id])
        render(conn, "index.html", user: user)
    end

    def show(conn, %{"username" => username}) do
        user = Repo.get_by(Whosthebest.User, username: username)
        render(conn, "show.html", user: user)
    end

    def edit(conn, %{"id" => id}) do
        user = Repo.get!(User, id)
        changeset = User.changeset(user)
        render(conn, "edit.html", user: user, changeset: changeset)
    end

    def update(conn, %{"id" => id, "user" => user_params}) do
        user = Repo.get!(User, id)
        
        check_pass = :false
        if(user_params["password_old"]) do
            check_pass = :false != Openmaize.LoginTools.check_pass(user, user_params["password_old"])
        end
        
        case check_pass do
            :false ->
                changeset = User.changeset(user, user_params)
                conn
                |> put_flash(:error, "Password incorrect.")
                |> render("edit.html", user: user, changeset: changeset)
            _success ->
                changeset = User.auth_changeset(user, user_params)
                case Repo.update(changeset) do
                    {:ok, user} ->
                        conn
                        |> put_flash(:info, "Profile updated successfully.")
                        |> redirect(to: user_path(conn, :show, user.username))
                    {:error, changeset} ->
                        render(conn, "edit.html", user: user, changeset: changeset)
                end
        end
    end
end

defmodule Whosthebest.UserController do
  use Whosthebest.Web, :controller
  
  import Openmaize.AccessControl
  alias Whosthebest.User

  plug :scrub_params, "user" when action in [:update]
  
  # users with either admin or user roles can access any resource in this module
  plug :authorize, roles: ["admin", "user"]

  # check current user id for the specified actions
  # remove the show atom to allow other users to view the show page
  plug :authorize_id when action in [:edit, :update]
  
  def index(conn, _params) do
    users = Repo.all(User)
    render(conn, "index.html", users: users)
  end

  def show(conn, %{"id" => id}) do
    user = Repo.get!(User, id)
    render(conn, "show.html", user: user)
  end

  def edit(conn, %{"id" => id}) do
    user = Repo.get!(User, id)
    changeset = User.changeset(user)
    render(conn, "edit.html", user: user, changeset: changeset)
  end

  def update(conn, %{"id" => id, "user" => user_params}) do
    user = Repo.get!(User, id)
    changeset = User.changeset(user, user_params)

    case Repo.update(changeset) do
      {:ok, user} ->
        conn
        |> put_flash(:info, "User updated successfully.")
        |> redirect(to: user_path(conn, :show, user))
      {:error, changeset} ->
        render(conn, "edit.html", user: user, changeset: changeset)
    end
  end
end

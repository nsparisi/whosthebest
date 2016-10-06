defmodule Whosthebest.AdminController do
    use Whosthebest.Web, :controller

    alias Whosthebest.User

    def index(conn, _params) do
        users = Repo.all(User)
        admin = Repo.get(User, conn.assigns[:current_user].id)
        render(conn, "index.html", users: users, admin: admin)
    end

    def delete(conn, %{"id" => id}) do
        user = Repo.get(User, id)
        Repo.delete(user)

        conn
        |> put_flash(:info, "User deleted successfully.")
        |> redirect(to: admin_path(conn, :index))
    end
end
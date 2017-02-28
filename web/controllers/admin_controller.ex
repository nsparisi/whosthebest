defmodule Whosthebest.AdminController do
    use Whosthebest.Web, :controller

    alias Whosthebest.User

    def index(conn, _params) do
        # disabling admin controller for now
        if true do
            conn
            |> redirect(to: page_path(conn, :index))
        else
            users = Repo.all(User)
            admin = Repo.get(User, get_session(conn, :user_id))
            render(conn, "index.html", users: users, admin: admin)
        end
    end

    def delete(conn, %{"id" => id}) do
        user = Repo.get(User, id)
        admin = Repo.get(User, get_session(conn, :user_id))

        # TODO add RBAC for admin role
        if true do
            conn
            |> redirect(to: page_path(conn, :index))
        else
            if admin.id == user.id do
                conn
                |> put_flash(:error, "Cannot delete yourself.")
                |> redirect(to: admin_path(conn, :index))
            else
                Repo.delete!(user)
                conn
                |> put_flash(:info, "User #{user.username} deleted successfully.")
                |> redirect(to: admin_path(conn, :index)) 
            end
        end
    end
end
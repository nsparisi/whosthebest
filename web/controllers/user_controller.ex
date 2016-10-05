defmodule Whosthebest.UserController do
    use Whosthebest.Web, :controller
    
    import Ecto.Query, only: [from: 2]
    import Whosthebest.Authorize
    alias Whosthebest.User

    plug :scrub_params, "user" when action in [:update]
    
    # users with either admin or user roles can access any resource in this module
    #plug :role_check, roles: ["admin", "user"]
    #plug :authorize, [roles: ["admin", "user"]] #when not action in [:create]

    # check current user id for the specified actions
    # remove the show atom to allow other users to view the show page
    plug :id_check when action in [:edit, :update]
  
    def index(conn, _params) do
        # don't need to be logged in anymore... ?
        # user = Repo.get!(User, conn.assigns[:current_user][:id])

        leaderboard_query = 
            from u in User, select: {u.username, u.total_time, u.total_wins, u.total_games}
            
        leaderboard_order_by_games =     
             from u in leaderboard_query,
             order_by: u.total_games
             
        leaderboard_order_by_wins =     
             from u in leaderboard_query,
             order_by: u.total_wins
             
        leaderboard_order_by_times =     
             from u in leaderboard_query,
             order_by: u.total_time

        users_by_games = Repo.all(leaderboard_order_by_games)
        users_by_wins = Repo.all(leaderboard_order_by_wins)
        users_by_times = Repo.all(leaderboard_order_by_times)

        render(
            conn, "index.html", 
            users_by_games: users_by_games, 
            users_by_wins: users_by_wins, 
            users_by_times: users_by_times)
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
        
        # todo fix this since it broke during openmaize upgrade
        # check_pass = :false
        check_pass = 
            if(user_params["password_old"]) do
                #check_pass = :false != Openmaize.LoginTools.check_pass(user, user_params["password_old"])
                :success
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

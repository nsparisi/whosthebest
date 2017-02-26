defmodule Whosthebest.UserController do
    use Whosthebest.Web, :controller
    
    import Ecto.Query, only: [from: 2]
    alias Whosthebest.{TokenAuthentication, User}

    #plug :scrub_params, "user" when action in [:update]
  
    def index(conn, _params) do
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
    
    @doc """
    Login page with email form.
    """
    def new(conn, _params) do
        render(conn, "new.html")
    end

    @doc """
    Sign up action, most likely UserController#create
    """
    def create(conn, %{"user" => user_params}) do
        changeset = User.changeset(
            %User{}, 
            Map.put(user_params, "username", User.generate_user_name))

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

    def update(conn, %{"id" => id, "user" => user_params}) do
        user = Repo.get!(User, id)
        changeset = User.changeset(user, user_params)

        # TODO
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

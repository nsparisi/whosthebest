defmodule Whosthebest.UserController do
    use Whosthebest.Web, :controller
    use Timex
    
    import Ecto.Query, only: [from: 2]
    alias Whosthebest.User
    alias Coherence.ControllerHelpers

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

    def update(conn, %{"id" => id, "user" => user_params}) do
        user = Repo.get!(User, id)
        changeset = User.changeset(user, user_params)

        case Repo.update(changeset) do
        {:ok, user} ->
            conn
            |> put_flash(:info, "Profile updated successfully.")
            |> redirect(to: user_path(conn, :show, user.username))
        {:error, changeset} ->
            render(conn, "edit.html", user: user, changeset: changeset)
        end
    end
    
    def confirm(conn, %{"id" => id}) do
        case Repo.get User, id do
        nil ->
            conn
            |> put_flash(:error, "User not found")
            |> redirect(to: user_path(conn, :index))
        user ->
            case ControllerHelpers.confirm! user do
            {:error, changeset}  ->
                conn
                |> put_flash(:error, format_errors(changeset))
            _ ->
                put_flash(conn, :info, "User confirmed!")
            end
            |> redirect(to: user_path(conn, :show, user.username))
        end
    end

    def lock(conn, %{"id" => id}) do
        locked_at = DateTime.now
        |> Timex.shift(years: 10)

        case Repo.get User, id do
        nil ->
            conn
            |> put_flash(:error, "User not found")
            |> redirect(to: user_path(conn, :index))
        user ->
            case ControllerHelpers.lock! user, locked_at do
            {:error, changeset}  ->
                conn
                |> put_flash(:error, format_errors(changeset))
            _ ->
                put_flash(conn, :info, "User locked!")
            end
            |> redirect(to: user_path(conn, :show, user.username))
        end
    end

    def unlock(conn, %{"id" => id}) do
        case Repo.get User, id do
        nil ->
            conn
            |> put_flash(:error, "User not found")
            |> redirect(to: user_path(conn, :index))
        user ->
            case ControllerHelpers.unlock! user do
            {:error, changeset}  ->
                conn
                |> put_flash(:error, format_errors(changeset))
            _ ->
                put_flash(conn, :info, "User unlocked!")
            end
            |> redirect(to: user_path(conn, :show, user.username))
        end
    end

    defp format_errors(changeset) do
        for error <- changeset.errors do
            case error do
                {:locked_at, {err, _}} -> err
                {_field, {err, _}} when is_binary(err) or is_atom(err) ->
                "#{err}"
                other -> inspect other
            end
        end
        |> Enum.join("<br \>\n")
    end
end

defmodule Whosthebest.Web.UserController do
    use Whosthebest.Web, :controller
    
    import Ecto.Query, only: [from: 2]
    alias Whosthebest.{TokenAuthentication, User, Match}

    plug :scrub_params, "user" when action in [:update]
  
    @doc """
    The landing page for /users. 
    Here we are running a couple of queries to set up a leaderboard of notable users.

    Considerations: The queries may be slow or inpractical, would need further testing to know.
    """
    def index(conn, _params) do

        # joins the User and Match tables based on winner id.
        # provides a count of wins each user has, and sorts by most wins.
        joined_winner_query =
            from u in User,
            inner_join: m in Match, on: u.id == m.winner_id,
            select: {u.username, u.id, count(m.winner_id)},
            group_by: [u.username, u.id],
            order_by: [desc: :count]

        top_winners = Repo.all(joined_winner_query)
        Whosthebest.Debug.log "top_winners #{inspect top_winners}"

        # joins the User and Match tables based on user id in any of the player positions.
        # counts up the number of games each user has participated in, and sorts by most games.
        joined_total_games_query =
            from u in User,
            inner_join: m in Match, on: u.id == m.user_id_0 or u.id == m.user_id_1 or u.id == m.user_id_2 or u.id == m.user_id_3,
            select: {u.username, u.id, count(u.username)},
            group_by: [u.username, u.id],
            order_by: [desc: :count]

        top_gamers = Repo.all(joined_total_games_query)
        Whosthebest.Debug.log "top_gamers #{inspect top_gamers}"

        # joins the User and Match tables based on user id in any of the player positions.
        # sums up the total time for each user, and sorts by most time spent in matches.
        joined_total_times_query =
            from u in User,
            inner_join: m in Match, on: u.id == m.user_id_0 or u.id == m.user_id_1 or u.id == m.user_id_2 or u.id == m.user_id_3,
            select: {u.username, u.id, sum(m.total_time)},
            group_by: [u.username, u.id]

        top_times = Repo.all(joined_total_times_query)
        Whosthebest.Debug.log "top_times #{inspect top_times}"

        render(
            conn, "index.html", 
            users_by_games: top_gamers, 
            users_by_wins: top_winners, 
            users_by_times: top_times)
    end

    @doc """
    A user's profile page viewable publically. 
    We can display info about the user, their bio, avatar, or whatever.
    For now we have recent match history of the player, which is pretty neat.
    """
    def show(conn, %{"username" => username}) do
        user = Repo.get_by(Whosthebest.User, username: username)
        if user == nil do
            conn
                |> put_flash(:error, "You don't have permission to view that page.")
                |> redirect(to: page_path(conn, :index))
        else
            # joins the User and Match tables to provide info, per match,
            # about this user's position, win/loss, and other remaining match data.
            # TODO this is only querying user0 and user1, seems buggy for 3 and 4.
            current_user_id = user.id
            match_history_query =
                from m in Match,
                inner_join: u0 in User, on: u0.id == m.user_id_0,
                inner_join: u1 in User, on: u1.id == m.user_id_1,
                select: {m.total_time, m.winner_id, m.user_id_0, u0.username, m.user_id_1, u1.username, m.inserted_at},
                where: m.user_id_0 == ^current_user_id or m.user_id_1 == ^current_user_id,
                order_by: [desc: m.inserted_at]

            match_history = Repo.all(match_history_query)
            Whosthebest.Debug.log "match_history #{inspect match_history}"

            render(
                conn, "show.html", 
                user: user,
                match_history: match_history)
        end
    end
    
    @doc """
    This is the "Register" page for new users. 
    However, both new and pre-existing users can use this page.
    """
    def new(conn, _params) do
        render(conn, "new.html")
    end

    @doc """
    This is the POST action from the "new" user page. 
    
    Create a new account if it does not exist for this user and send an email which 
    contains the magic-url that will log in the client to their account.

    In all cases, we will send an email to avoid any sort of snooping.
    """
    def create(conn, %{"user" => user_params}) do

        # verify the captcha
        case Recaptcha.verify(user_params["g-recaptcha-response"]) do
            {:error, _errors} -> 
                conn
                    |> put_flash(:error, "Sorry, there was a problem creating the account.")
                    |> render("new.html")
            {:ok, _response} -> 

                # retrieve an existing user
                user = Repo.get_by(Whosthebest.User, email: user_params["email"])

                # if the user does not exist, create one
                if user == nil do
                    changeset = User.changeset(%User{},Map.put(user_params, "username", User.generate_user_name))
                    case Repo.insert(changeset) do
                        {:ok, user} ->
                            TokenAuthentication.provide_token(user)
                            conn
                                |> put_flash(:info, "Welcome! Please check your email for a link to login.")
                                |> redirect(to: page_path(conn, :index))

                        {:error, changeset} ->
                            conn
                                |> put_flash(:error, "Sorry, there was a problem creating the account.")
                                |> render("new.html", changeset: changeset)
                    end
                else
                    TokenAuthentication.provide_token(user)
                    conn
                        |> put_flash(:info, "Welcome! Please check your email for a link to login.")
                        |> redirect(to: page_path(conn, :index))
                end
        end
    end

    @doc """
    The edit page to let a user change their profile.
    """
    def edit(conn, %{"id" => id}) do
        user_id = get_session(conn, :user_id)

        # not allowed to edit other users
        if(id != to_string(user_id)) do
            conn
                |> put_flash(:error, "You don't have permission to view that page.")
                |> redirect(to: page_path(conn, :index))
        else
            user = Repo.get!(User, id)
            changeset = User.changeset(user, %{})
            render(conn, "edit.html", user: user, changeset: changeset)
        end
    end

    @doc """
    This is the POST action called from the edit page.
    """
    def update(conn, %{"id" => id, "user" => user_params}) do
        user_id = get_session(conn, :user_id)

        # not allowed to edit other users
        if(id != to_string(user_id)) do
            conn
                |> put_flash(:error, "You don't have permission to view that page.")
                |> redirect(to: page_path(conn, :index))
        else
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
    end
end

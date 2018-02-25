defmodule Whosthebest.Web.SessionController do
  @moduledoc """
    Actions for creating and signing in with magic link tokens.
  """
  use Whosthebest.Web, :controller

  alias Whosthebest.{TokenAuthentication}

  @doc """
    Login page with email form.
    **** This is currently not used, see UsersController.new
  """
  def new(conn, _params) do
    render(conn, "new.html")
  end
  
  @doc """
    Generates and sends magic login token if the user can be found.
    **** This is currently not used, see UsersController.create
  """
  def create(conn, %{"session" => %{"email" => email}}) do
    TokenAuthentication.provide_token(email)

    # do not leak information about (non-)existing users.
    # always reply with success message, even though the
    # user might not exist.
    conn
    |> put_flash(:info, "We have sent you a link for signing in via email to #{email}.")
    |> redirect(to: page_path(conn, :index))
  end

  @doc """
    Login user via magic link token.
    Sets the given user as `current_user` and updates the session.
  """
  def show(conn, %{"token" => token}) do
    case TokenAuthentication.verify_token_value(token) do
      {:ok, user} ->
        conn
        |> assign(:current_user, user)
        |> put_session(:user_id, user.id)
        |> configure_session(renew: true)
        |> put_flash(:info, "You signed in successfully.")
        |> redirect(to: page_path(conn, :index))
        
      {:error, _reason} ->
        conn
        |> put_flash(:error, "The login token is invalid.")
        |> redirect(to: page_path(conn, :index))
        #user = Repo.get(User, 1)
        #conn
        #|> assign(:current_user, user)
        #|> put_session(:user_id, user.id)
        #|> configure_session(renew: true)
        #|> put_flash(:info, "You signed in successfully.")
        #|> redirect(to: page_path(conn, :index))
    end
  end
  
  @doc """
    Ends the current session.
  """
  def delete(conn, _params) do
    conn
    |> assign(:current_user, nil)
    |> configure_session(drop: true)
    |> delete_session(:user_id)
    |> put_flash(:info, "You logged out successfully. Enjoy your day!")
    |> redirect(to: page_path(conn, :index))
  end
end

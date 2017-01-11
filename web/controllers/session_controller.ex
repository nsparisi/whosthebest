defmodule Whosthebest.SessionController do
  @moduledoc """
    Actions for creating and signing in with magic link tokens.
  """
  use Whosthebest.Web, :controller

  alias Whosthebest.{TokenAuthentication, User}

  @doc """
    Login page with email form.
  """
  def new(conn, _params) do
    render(conn, "new.html")
  end
  
  @doc """
    Generates and sends magic login token if the user can be found.
  """
  def create(conn, %{"session" => %{"email" => email}}) do
    case TokenAuthentication.provide_token(email) do
      {:ok, _user} ->
        conn
        |> put_flash(:info, "We have sent you a link for signing in via email. See you soon!")
        |> redirect(to: page_path(conn, :index))

      {:error, reason} ->
        message = case reason do
          :not_found -> "The email is invalid. Did you sign up with #{email}?"
          _other -> "Something went wrong. Sorry, we messed up here!"
        end

        conn
        |> put_flash(:error, message)
        |> render("new.html", email: email)
    end
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

      {:error, reason} ->
        message = case reason do
          :invalid -> "The login token is invalid."
          _other -> "Something went wrong. Sorry, we messed up here!"
        end

        conn
        |> put_flash(:error, message)
        |> redirect(to: session_path(conn, :new))
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

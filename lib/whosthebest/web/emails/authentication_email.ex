defmodule Whosthebest.Web.AuthenticationEmail do
  use Bamboo.Phoenix, view: Whosthebest.Web.EmailView

  import Bamboo.Email

  @doc """
    The sign in email containing the login link.
  """
  def login_link_text_email(token_value, user) do
    new_email()
    |> to(user.email)
    |> from("email@blockgame.website")
    |> subject("Your login link")
    |> assign(:token, token_value) 
    |> put_text_layout({Whosthebest.Web.LayoutView, "email.text"})
    |> render("login_link.text")
  end

  def login_link_html_email(token_value, user) do
    login_link_text_email(token_value, user)
    |> put_html_layout({Whosthebest.Web.LayoutView, "email.html"})
    |> render("login_link.html")
  end
end
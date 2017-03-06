defmodule Whosthebest.AuthToken do
  use Whosthebest.Web, :model

  alias Phoenix.Token

  schema "auth_tokens" do
    field :value, :string
    belongs_to :user, Whosthebest.User

    timestamps
  end

  @doc """
  Builds a changeset based on the `struct` and `user`.
  """
  def changeset(struct, user) do
    struct
    |> cast(%{}, []) # convert the struct without taking any params
    |> put_assoc(:user, user)
    |> put_change(:value, generate_token(user))
    |> validate_required([:value, :user])
    |> unique_constraint(:value)
  end
  
  defp generate_token(nil), do: nil
  defp generate_token(user) do
    Token.sign(Whosthebest.Web.Endpoint, "user", user.id)
  end
end

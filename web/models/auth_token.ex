defmodule Whosthebest.AuthToken do
  use Whosthebest.Web, :model

  schema "auth_tokens" do
    field :value, :string
    belongs_to :user, Whosthebest.User

    timestamps(updated_at: false)
  end

  @doc """
  Builds a changeset based on the `struct` and `user`.
  """
  def changeset(struct, user) do
    struct
    |> cast(%{}, []) # convert the struct without taking any params
    |> put_assoc(:user, user)
    |> put_change(:value, generate_token(42))
    |> validate_required([:value, :user])
    |> unique_constraint(:value)
  end

  # generate a random and url-encoded token of given length
  defp generate_token(length) do
    random = :crypto.strong_rand_bytes(length)
    random
    |> Base.url_encode64
    |> binary_part(0, length)
  end
end

defmodule Whosthebest.User do
  use Whosthebest.Web, :model

  schema "users" do
    field :name, :string
    field :email, :string
    field :password, :string
    field :last_game_id, :string

    timestamps
  end

  @required_fields ~w(name email password)
  @optional_fields ~w(last_game_id)

  @doc """
  Creates a changeset based on the `model` and `params`.

  If no params are provided, an invalid changeset is returned
  with no validation performed.
  """
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields, @optional_fields)
    |> validate_length(:name, min: 3)
    |> validate_length(:name, max: 20)
    |> validate_length(:password, min: 3)
    |> validate_length(:password, max: 50)
    |> validate_format(:email, ~r/@/)
  end
end

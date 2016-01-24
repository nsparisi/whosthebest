defmodule Whosthebest.User do
  use Whosthebest.Web, :model
  
  alias Openmaize.Signup

  schema "users" do
    field :name, :string
    field :email, :string
    field :last_game_id, :string
    
    #openmaize requirements
    field :role, :string
    field :password, :string, virtual: true
    field :password_hash, :string

    timestamps
  end

  @required_fields ~w(name email role password)
  @optional_fields ~w(last_game_id password_hash)

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
    |> validate_length(:password, min: 8)
    |> validate_length(:password, max: 80)
    |> validate_format(:email, ~r/@/)
    |> unique_constraint(:email)
    |> unique_constraint(:name)
  end
  
  def auth_changeset(model, params) do
    model
    |> changeset(params)
    |> Signup.create_user(params)
  end
end

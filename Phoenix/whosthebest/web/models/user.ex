defmodule Whosthebest.User do
  use Whosthebest.Web, :model
  
  alias Openmaize.Signup

  schema "users" do
    field :username, :string
    field :email, :string
    field :last_game_id, :string
    
    #openmaize requirements
    field :role, :string
    field :password, :string, virtual: true
    field :password_hash, :string

    timestamps
  end

  @required_fields ~w(username role password)
  @optional_fields ~w(last_game_id password_hash email)

  @doc """
  Creates a changeset based on the `model` and `params`.

  If no params are provided, an invalid changeset is returned
  with no validation performed.
  """
  def changeset(model, params \\ :empty) do
    if(is_map(params) and !Map.has_key?(params, :role)) do
        params = Map.put(params, "role", "user")
    end
  
    model
    |> cast(params, @required_fields, @optional_fields)
    |> validate_length(:username, min: 3)
    |> validate_length(:username, max: 20)
    |> validate_length(:password, min: 6)
    |> validate_length(:password, max: 80)
    |> validate_confirmation(:password, message: "passwords do not match")
    |> unique_constraint(:username)
  end
  
  def auth_changeset(model, params) do
    model
    |> changeset(params)
    |> Signup.create_user(params, [min_length: 6, max_length: 80])
  end
end

defmodule Whosthebest.User do
  use Whosthebest.Web, :model
  
  alias Whosthebest.OpenmaizeEcto

  schema "users" do
    field :username, :string
    field :email, :string
    field :last_game_id, :string
    
    #openmaize requirements
    field :role, :string
    field :password, :string, virtual: true
    field :password_hash, :string
    field :confirmed_at, Ecto.DateTime
    field :confirmation_token, :string
    field :confirmation_sent_at, Ecto.DateTime
    field :reset_token, :string
    field :reset_sent_at, Ecto.DateTime
    field :otp_required, :boolean
    field :otp_secret, :string

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
    |> validate_length(:username, max: 12)
    |> validate_length(:password, min: 4)
    |> validate_length(:password, max: 80)
    |> validate_confirmation(:password, message: "passwords do not match")
    |> unique_constraint(:username)
  end
  
  def auth_changeset(model, params) do
    model
    |> changeset(params)
    |> OpenmaizeEcto.add_password_hash(params)
  end

  def reset_changeset(model, params, key) do
    model
    |> cast(params, ~w(email), [])
    |> OpenmaizeEcto.add_reset_token(key)
  end

  def update_game_id(model, game_id) do
    changeset = cast(model, %{last_game_id: game_id}, [:last_game_id])
    if changeset.valid? do
      Whosthebest.Repo.update!(changeset)
    end
  end

  def validate_guest(model, guest_name) do
    model
      |> cast(%{username: guest_name}, [:username])
      |> validate_length(:username, min: 3)
      |> validate_length(:username, max: 12)
      |> unique_constraint(:username)
  end
end

defmodule Whosthebest.User do
  use Whosthebest.Web, :model
  
  alias Whosthebest.OpenmaizeEcto

  schema "users" do
    field :username, :string
    field :email, :string 
    field :total_time, :integer
    field :total_games, :integer 
    field :total_wins, :integer 

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
  @optional_fields ~w(password_hash email total_time total_games total_wins)

  @doc """
  Creates a changeset based on the `model` and `params`.

  If no params are provided, an invalid changeset is returned
  with no validation performed.
  """
  def changeset(model, params \\ :empty) do
    
    params = 
        if(is_map(params) and !Map.has_key?(params, :role)) do
            Map.put(params, :role, "user")
        else
            params
        end
    
    params =
        params
        |> Map.put(:total_time, 0)
        |> Map.put(:total_games, 0)
        |> Map.put(:total_wins, 0)
        |> Map.put(:otp_required, false)

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

  def validate_guest(model, guest_name) do
    model
      |> cast(%{username: guest_name}, [:username])
      |> validate_length(:username, min: 3)
      |> validate_length(:username, max: 12)
      |> unique_constraint(:username)
  end
end

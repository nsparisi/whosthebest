defmodule Whosthebest.User do
  use Whosthebest.Web, :model

  schema "users" do
    field :username, :string
    field :email, :string 
    field :total_time, :integer
    field :total_games, :integer 
    field :total_wins, :integer 
    
    timestamps()

    # add the association among the rest of the schema
    has_many :auth_tokens, Whosthebest.AuthToken
  end

  @required_fields ~w(email)a
  @optional_fields ~w(username total_time total_games total_wins)a

  @doc """
  Creates a changeset based on the `model` and `params`.

  If no params are provided, an invalid changeset is returned
  with no validation performed.
  """
  def changeset(model, params \\ :empty) do  

    # todo, email and username uniqueness
    # todo, case-insensitive 
    model
    |> cast(params, [:username, :email, :total_time, :total_games, :total_wins])
    |> validate_length(:username, min: 3)
    |> validate_length(:username, max: 12)
    |> update_change(:email, &String.downcase/1)
    |> unique_constraint(:username)
    |> unique_constraint(:email) # TODO
  end

  @doc """
  Creates a changeset based on the model and post-game information.

  Updates the following fields on the user model:
  :total_wins
  :total_games
  :total_time
  """
  def changeset_postgame(model, is_winner, game_time) do
    total_wins = 
      if is_winner do
          model.total_wins + 1
      else
          model.total_wins
      end

    params = %{
      :total_wins => total_wins,
      :total_games => model.total_games + 1,
      :total_time => model.total_time + game_time
    }

    cast(model, params, [:total_wins, :total_games, :total_time])
  end

  def validate_guest(model, guest_name) do
    model
      |> cast(%{username: guest_name}, [:username])
      |> validate_length(:username, min: 3)
      |> validate_length(:username, max: 12)
      |> unique_constraint(:username)
  end

  def generate_user_name() do
    "user" <> generate_random_name()
  end

  def generate_guest_name() do
    generate_random_name()
  end

  defp generate_random_name() do
    :crypto.strong_rand_bytes(5) |> Base.hex_encode32 |> binary_part(0, 6)
  end
end

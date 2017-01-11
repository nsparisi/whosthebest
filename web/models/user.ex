defmodule Whosthebest.User do
  use Whosthebest.Web, :model

  schema "users" do
    field :username, :string
    field :email, :string 
    field :total_time, :integer
    field :total_games, :integer 
    field :total_wins, :integer 
    
    timestamps

    # add the association among the rest of the schema
    has_many :auth_tokens, AuthToken
  end

  @required_fields ~w(username)
  @optional_fields ~w(email total_time total_games total_wins)

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
end

defmodule Whosthebest.User do
  use Whosthebest.Web, :model
  use Coherence.Schema

  schema "users" do
    field :username, :string
    field :email, :string 
    field :total_time, :integer
    field :total_games, :integer 
    field :total_wins, :integer 
    
    coherence_schema 

    timestamps
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
    |> cast(params, [:username, :email, :total_time, :total_games, :total_wins] ++ coherence_fields)
    |> validate_length(:username, min: 3)
    |> validate_length(:username, max: 12)
    |> update_change(:email, &String.downcase/1)
    |> unique_constraint(:email)
    |> validate_coherence(params)
  end

  def validate_guest(model, guest_name) do
    model
      |> cast(%{username: guest_name}, [:username])
      |> validate_length(:username, min: 3)
      |> validate_length(:username, max: 12)
      |> unique_constraint(:username)
  end
end

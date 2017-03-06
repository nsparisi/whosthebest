defmodule Whosthebest.Match do
  use Whosthebest.Web, :model

  schema "matches" do
    field :total_time, :integer
    field :winner_id, :integer
    field :user_id_0, :integer
    field :user_id_1, :integer
    field :user_id_2, :integer
    field :user_id_3, :integer
    timestamps
  end

  @required_fields ~w(total_time winner_id user_id_0 user_id_1)
  @optional_fields ~w(user_id_2 user_id_3)

  @doc """
  Creates a changeset based on the `model` and `params`.

  If no params are provided, an invalid changeset is returned
  with no validation performed.
  """
  def changeset(model, params \\ :empty) do  
    model
    |> cast(params, @required_fields, @optional_fields)
  end

  @doc """
  Creates a changeset based on the model and post-game information.

  Updates the following fields on the user model:
  :total_wins
  :total_games
  :total_time
  """
  def changeset_postgame(model, user_ids, winner_id, game_time) do
    # names with a hyphen are guest UUIDs and we won't keep track
    winner_id =  scrub_guest_id winner_id
    user_id_0 =  scrub_guest_id Enum.at(user_ids, 0)
    user_id_1 =  scrub_guest_id Enum.at(user_ids, 1)
    user_id_2 =  scrub_guest_id Enum.at(user_ids, 2)
    user_id_3 =  scrub_guest_id Enum.at(user_ids, 3)

    params = %{
      total_time: game_time, 
      winner_id: winner_id,
      user_id_0: user_id_0, 
      user_id_1: user_id_1, 
      user_id_2: user_id_2, 
      user_id_3: user_id_3 
    }

    cast(model, params, @required_fields, @optional_fields)
  end

  defp scrub_guest_id(nil) do nil end 
  defp scrub_guest_id(id) do
     if String.contains? id, "-" do -1 else String.to_integer(id) end
  end
end

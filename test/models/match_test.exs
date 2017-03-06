defmodule Whosthebest.MatchTest do
  use Whosthebest.ModelCase

  alias Whosthebest.Match

  @valid_attrs %{total_time: 42, user_id_1: 42, user_id_2: 42, user_id_3: 42, user_id_4: 42, winner_id: 42}
  @invalid_attrs %{}

  test "changeset with valid attributes" do
    changeset = Match.changeset(%Match{}, @valid_attrs)
    assert changeset.valid?
  end

  test "changeset with invalid attributes" do
    changeset = Match.changeset(%Match{}, @invalid_attrs)
    refute changeset.valid?
  end
end

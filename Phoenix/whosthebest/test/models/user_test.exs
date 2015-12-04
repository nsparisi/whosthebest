defmodule Whosthebest.UserTest do
  use Whosthebest.ModelCase

  alias Whosthebest.User

  @valid_attrs %{email: "some content", last_game_id: "some content", name: "some content", password: "some content"}
  @invalid_attrs %{}

  test "changeset with valid attributes" do
    changeset = User.changeset(%User{}, @valid_attrs)
    assert changeset.valid?
  end

  test "changeset with invalid attributes" do
    changeset = User.changeset(%User{}, @invalid_attrs)
    refute changeset.valid?
  end
end

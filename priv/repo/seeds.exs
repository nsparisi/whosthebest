# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Whosthebest.Repo.insert!(%SomeModel{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

Whosthebest.Repo.delete_all Whosthebest.User

# TODO fix this
users = [
  %{
    username: "nick",
    email: "nick@mail.com",
    password: "test",
    password_confirmation: "test"
  },
  %{
    username: "nat",
    email: "nat@mail.com",
    password: "test",
    password_confirmation: "test"
  },
  %{
    username: "admin",
    email: "admin@mail.com",
    password: "test",
    password_confirmation: "test"
  }
]

for user <- users do
  Whosthebest.User.changeset(%Whosthebest.User{}, user) |> Whosthebest.Repo.insert!
end
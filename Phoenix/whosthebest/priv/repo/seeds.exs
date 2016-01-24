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

users = [
  %{
    name: "nick",
    email: "nick@mail.com",
    password_hash: Comeonin.Bcrypt.hashpwsalt("test"),
    role: "user",
  },
  %{
    name: "nat",
    email: "dick@mail.com",
    password_hash: Comeonin.Bcrypt.hashpwsalt("test"),
    role: "user",
  },
  %{
    name: "admin",
    email: "admin@mail.com",
    password_hash: Comeonin.Bcrypt.hashpwsalt("test"),
    role: "admin",
  }
]

for user <- users do
  Map.merge(%Whosthebest.User{}, user) |> Whosthebest.Repo.insert!
end
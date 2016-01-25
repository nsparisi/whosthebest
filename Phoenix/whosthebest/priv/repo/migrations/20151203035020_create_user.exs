defmodule Whosthebest.Repo.Migrations.CreateUser do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :username, :string
      add :email, :string
      add :last_game_id, :string
      add :role, :string
      add :password_hash, :string

      timestamps
    end

  end
end

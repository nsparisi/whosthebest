defmodule Whosthebest.Repo.Migrations.CreateUser do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :name, :string
      add :email, :string
      add :password, :string
      add :last_game_id, :string

      timestamps
    end

  end
end

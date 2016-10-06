defmodule Whosthebest.Repo.Migrations.CreateUser do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :username, :string
      add :email, :string
      
      add :total_time, :integer, default: 0
      add :total_games, :integer, default: 0
      add :total_wins, :integer, default: 0

      timestamps
    end

    create unique_index :users, [:username]
  end
end

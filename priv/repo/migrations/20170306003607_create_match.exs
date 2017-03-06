defmodule Whosthebest.Repo.Migrations.CreateMatch do
  use Ecto.Migration

  def change do
    create table(:matches) do
      add :total_time, :integer
      add :winner_id, :integer
      add :user_id_0, :integer
      add :user_id_1, :integer
      add :user_id_2, :integer
      add :user_id_3, :integer

      timestamps()
    end

  end
end

defmodule Whosthebest.Repo.Migrations.CreateUser do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :username, :string
      add :email, :string
      
      add :total_time, :integer
      add :total_games, :integer 
      add :total_wins, :integer 
      
      add :role, :string
      add :password_hash, :string
      add :confirmed_at, :datetime
      add :confirmation_token, :string
      add :confirmation_sent_at, :datetime
      add :reset_token, :string
      add :reset_sent_at, :datetime
      add :otp_required, :boolean
      add :otp_secret, :string

      timestamps
    end

    create unique_index :users, [:username]
  end
end

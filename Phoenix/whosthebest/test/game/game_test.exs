defmodule Whosthebest.GameTest do
    use Whosthebest.ConnCase

    alias Whosthebest.GameManager
    alias Whosthebest.GameServer

    @valid_attrs %{email: "some@content"}
    @invalid_attrs %{}
    @game_key "game:1"
    @user1 "user:1"
    @user2 "user:2"

    test "GameManager game creation" do
        {:ok, manager} = GameManager.start_link()
        assert Process.alive? manager
        
        game = GameManager.get_or_create_game(manager, @game_key)
        assert Process.alive? game
    end

    test "GameManager kill game instance" do
        {:ok, manager} = GameManager.start_link()
        game = GameManager.get_or_create_game(manager, @game_key)
        GameManager.kill_game(manager, @game_key)
        
        # kill game is async, so wait a second before asserting
        :timer.sleep(1000)
        refute Process.alive? game
    end
    
    test "GameServer client-side scenario" do
        {:ok, manager} = GameManager.start_link()
        game = GameManager.get_or_create_game(manager, @game_key)
        
        user1_inputs = ",1,2"
        user2_inputs = ",3,4"
        message1_1 = "1~" <> user1_inputs
        message1_2 = "2~" <> user1_inputs
        message2_1 = "1~" <> user2_inputs
        message2_2 = "2~" <> user2_inputs
        
        #setup
        GameServer.join_user(game, @user1)
        GameServer.join_user(game, @user2)
        
        assert :ok == GameServer.handle_message(game, @user1, message1_1)
        {:broadcast, payload} = GameServer.handle_message(game, @user2, message2_1)
        assert payload == "1~" <> user1_inputs <> "~" <> user2_inputs
        
        assert :ok == GameServer.handle_message(game, @user2, message2_2)
        {:broadcast, payload} = GameServer.handle_message(game, @user1, message1_2)
        assert payload == "2~" <> user1_inputs <> "~" <> user2_inputs
    end
    
    test "GameServer to-server translation" do
        payload = "2~,1,2,3,4"
        translation = GameServer.to_server_frame_translation(payload)
        assert translation[:frame] == "2"
        assert translation[:inputs] == ",1,2,3,4"
    end
end

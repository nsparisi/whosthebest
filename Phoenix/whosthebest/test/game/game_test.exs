defmodule Whosthebest.GameTest do
    use Whosthebest.ConnCase

    alias Whosthebest.GameManager
    alias Whosthebest.GameServer

    @valid_attrs %{email: "some@content"}
    @invalid_attrs %{}
    @game_key "game:1"

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
    
    test "GameServer scenario" do
        {:ok, manager} = GameManager.start_link()
        game = GameManager.get_or_create_game(manager, @game_key)
        
        user1 = "user:1"
        user2 = "user:2"
        message1 = "1~,1,2,3,4"
        message2 = "2~,1,2,3,4"
        
        #setup
        GameServer.join_user(game, user1)
        GameServer.join_user(game, user2)
        
        GameServer.handle_message(game, user1, message1)
        GameServer.handle_message(game, user2, message1)
        
        #assert GameServer.dequeue_frame(game, user2)[:frame] == "1"
        
        GameServer.handle_message(game, user2, message1)
        GameServer.handle_message(game, user2, message2)
        #assert GameServer.dequeue_frame(game, user2)[:frame] == "1"
        #assert GameServer.dequeue_frame(game, user2)[:frame] == "2"
    end
    
    test "GameServer translation" do
        payload = "2~,1,2,3,4"
        translation = GameServer.to_server_frame_translation(payload)
        assert translation[:frame] == "2"
        assert translation[:inputs] == ",1,2,3,4"
    end
end

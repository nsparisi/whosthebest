defmodule Whosthebest.GameManager do
    use GenServer
    alias Whosthebest.GameServer
    alias Whosthebest.Debug
        
    @doc """
    Starts a new instance of a game manager.
    """
    def start_link(opts \\ []) do
        Debug.log("GameManager  start_link")
        GenServer.start_link(__MODULE__, :ok, opts)
    end
    
    @doc """
    Gets or creates a game instance base on the provided key.
    """
    def get_or_create_game(server, key) do
        Debug.log("GameManager get_or_create_game " <> key)
        GenServer.call(server, {:get, key})
    end
    
    @doc """
    Kills the game with the provided key.
    """
    def kill_game(server, key) do
        Debug.log("GameManager  kill_game " <> key)
        GenServer.call(server, {:kill, key})
    end
    
    # ********************************
    # Server callbacks
    # ********************************
    def init(:ok) do
        Debug.log("GameManager  init")
        {:ok, Map.new}
    end
    
    def handle_call({:get, key}, _from, state) do
        Debug.log("GameManager  handle_call get " <> key)
        
        if !Map.has_key?(state, key) do
            Debug.log("GameManager  starting new game")
            {:ok, game} = GameServer.start()
            state = Map.put(state, key, game)
        end
        
        {:reply, Map.fetch!(state, key), state}
    end
    
    def handle_call({:kill, key}, _from, state) do
        Debug.log("GameManager  handle_cast kill " <> key)
        
        if Map.has_key?(state, key) do
            Debug.log("GameManager  deleting game")
            Process.exit(Map.fetch!(state, key), :shutdown)
            state = Map.delete(state, key)
        end
        {:reply, nil, state}
    end
    
    # todo implement game cleanup.
end
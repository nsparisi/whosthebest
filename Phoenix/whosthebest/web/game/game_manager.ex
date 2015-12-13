defmodule Whosthebest.GameManager do
    use GenServer
    alias Whosthebest.GameServer
    alias Whosthebest.Debug
        
    @doc """
    Starts a new instance of a game server.
    """
    def start_link(opts \\ []) do
        Debug.log("GameManager  start_link")
        GenServer.start_link(__MODULE__, :ok, opts)
    end
    
    @doc """
    Gets or creates a game base on the provided key.
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
        GenServer.cast(server, {:kill, key})
    end
    
    # ********************************
    # Server callbacks
    # ********************************
    
    def init(:ok) do
        Debug.log("GameManager  init")
        {:ok, HashDict.new}
    end
    
    def handle_call({:get, key}, _from, state) do
        Debug.log("GameManager  handle_call get " <> key)
        
        if !HashDict.has_key?(state, key) do
            Debug.log("GameManager  starting new game")
            {:ok, game} = GameServer.start()
            state = HashDict.put(state, key, game)
        end
        
        {:reply, HashDict.fetch!(state, key), state}
    end
    
    def handle_cast({:kill, key}, state) do
        Debug.log("GameManager  handle_cast kill " <> key)
        
        if HashDict.has_key?(state, key) do
            Debug.log("GameManager  deleting game")
            Process.exit(HashDict.fetch!(state, key), :shutdown)
            state = HashDict.delete(state, key)
        end
        {:noreply, state}
    end
end
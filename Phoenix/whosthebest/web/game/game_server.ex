defmodule Whosthebest.GameServer do
    use GenServer
    alias Whosthebest.Debug
    
    @doc """
    Starts a new instance of a game server.
    """
    def start(opts \\ []) do
        Debug.log("GameServer  start")
        GenServer.start(__MODULE__, :ok, opts)
    end
    
    @doc """
    Joins a user to this game.
    """
    def join_user(server, user) do
        Debug.log("GameServer  join_user " <> user)
        GenServer.cast(server, {:join, user})
    end
    
    @doc """
    Passes a message sent from a user to this game server.
    """
    def handle_message(server, user, message) do
        GenServer.call(server, {:message, user, message})
    end
    
    @doc """
    Gets the current state of the game. Such as 
    :initializing or :ready
    """
    def get_game_state(server) do
        GenServer.call(server, :get_game_state)
    end
    
    @doc """
    Resets the game server
    """
    def reset(server) do
        GenServer.call(server, :reset)
    end
    
    @doc """
    Gets the internal state of the Server, for testing purposes.
    """
    def get_state(server) do
        GenServer.call(server, :state)
    end
    
    @doc """
    Clears the message buffers for every user in the game.
    """
    def clear_frames(server) do
        Debug.log("GameServer  clear frames ")
        GenServer.call(server, :clear_frames)
    end
    
    # ********************************
    # Server callbacks
    # ********************************
    # the state of this server will be a Map with the following values:
    # :number_of_players = 2
    # :game_state = :initializing/:ready
    # :user_frames = Map mapping user ids to a queue of frames
    # A frame will contain any metadata about a particular frame received 
    # from the user, including the message payload.
    # User1 -> frame4   User2 -> frame4
    #       -> frame3         -> frame3
    #       -> frame2         -> frame2
    #       -> frame1         -> frame1
    def init(:ok) do
        Debug.log("GameServer  init")
        :timer.send_interval(5000, :refresh)
        {:ok, new_state }
    end
    
    def new_state do
        %{
            :number_of_players => 2, 
            :game_state => :initializing, 
            :user_frames => Map.new
        }
    end
    
    def handle_cast({:join, user}, state) do
        Debug.log("GameServer  handle_cast join " <> user)
        if !Map.has_key?(state[:user_frames], user) do
        
            # add the user to the game
            user_frames = Map.put(state[:user_frames], user, [])
            state = Map.put(state, :user_frames, user_frames)
            
            # if all of the user have joined, mark as ready
            if state[:number_of_players] == length(Map.keys(user_frames)) do
                state = Map.put(state, :game_state, :ready)
            end
        end
        {:noreply, state}
    end
    
    def handle_call({:message, user, message}, _from, state) do
        frame_data = to_server_frame_translation(message)
        {:ok, state} = enqueue_message(state, user, frame_data)
        case process_queues(state) do
            {:ok, current_state} ->
                {:reply, :ok, current_state}
            {:broadcast, payload, current_state} ->
                {:reply, {:broadcast, payload}, current_state}
        end
    end
    
    def handle_call(:get_game_state, _from, state) do
        {:reply, state[:game_state], state}
    end
    
    def handle_call(:state, _from, state) do
        {:reply, state, state}
    end
    
    def handle_call(:reset, _from, state) do
        {:reply, nil, new_state}
    end
    
    def handle_call(:clear_frames, _from, state) do
        state = Enum.reduce(
            Map.keys(state[:user_frames]), state,
            fn(user, acc) ->
                # for every user key, set the value to an empty list  
                user_frames = Map.put(acc[:user_frames], user, []) 
                
                # return an updated acc
                Map.put(acc, :user_frames, user_frames)
            end)
        
        {:reply, nil, state}
    end
    
    #unused right now
    def handle_info(:refresh, state) do
        {:noreply, state}
    end
    
    # Payload structure is as follows.
    #
    # from server:
    # <id>|<timestamp>|<type>|<payload>|<eom>
    # when type = StartMatch, payload = random seed
    # when type = Frame, payload = 
    #   frame~,player,1,inputs~player,2,inputs
    #
    # from client:
    # <id>|<timestamp>|<type>|<payload>|<eom>
    # payload = <frame>~,<input>,<input>
    
    @packet_delimiter "|"
    @frame_delimiter "~"
    @input_delimiter ","
    def to_server_frame_translation(payload) do
        split = String.split(payload, @frame_delimiter)        
        %{frame: List.first(split), inputs: List.last(split)}
    end
    
    def process_queues(state) do
        if(queues_ready?(state)) do
            {:ok, payload, state} = dequeue_and_form_payload(state)
            {:broadcast, payload, state}
        else
            {:ok, state}
        end
    end
    
    def queues_ready?(state) do
        # for each user: check if the queue length is not-empty
        Enum.reduce(Map.values(state[:user_frames]), true, 
            fn(queue, acc) -> 
                length(queue) > 0 && acc 
            end)
    end
    def dequeue_and_form_payload(state) do
        # dequeue once for each user, and formulate a broadcast payload.
        # TODO someday have an ordering here, sort is bad.
        all_users = Enum.sort(Map.keys(state[:user_frames]))
        peek_frame = peek_message(state, List.first(all_users))[:frame]
        %{:payload => payload, :state => state} = 
            Enum.reduce(all_users, %{payload: peek_frame, state: state}, 
                fn(user, acc) -> 
                    {:ok, message, current_state} = dequeue_message(acc[:state], user)
                    current_payload = acc[:payload] <> @frame_delimiter <> message[:inputs]
                    %{state: current_state, payload: current_payload}
                end)
        {:ok, payload, state}
    end
    
    def enqueue_message(state, user, message) do
        new_queue = Map.fetch!(state[:user_frames], user) ++ [message]
        user_frames = Map.put(state[:user_frames], user, new_queue)
        state = Map.put(state, :user_frames, user_frames)
        {:ok, state}
    end
    
    def dequeue_message(state, user) do
        [frame | new_queue] = Map.fetch!(state[:user_frames], user)
        user_frames = Map.put(state[:user_frames], user, new_queue)
        state = Map.put(state, :user_frames, user_frames)
        {:ok, frame, state}
    end
    
    def peek_message(state, user) do
        List.first(Map.fetch!(state[:user_frames], user))
    end
    
    def to_pretty_string(state) do
        user_frames = state[:user_frames]
        Enum.reduce(Map.keys(user_frames), "",
            fn(user, acc) -> 
                queue = Map.fetch!(user_frames, user)
                queue_string = Enum.reduce(queue, "", 
                    fn(item, acc) -> 
                        acc <> "{frame:" <> item[:frame] <> " inputs:" <> item[:inputs] <> "}"
                    end)
                acc <> "{ user=>" <> user <> ", queue=>[" <> queue_string <> "]} "
            end)
    end
end
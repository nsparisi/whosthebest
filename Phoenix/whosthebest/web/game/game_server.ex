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
        Debug.log("GameServer  join_user " <> user <> " : " <> message)
        GenServer.call(server, {:message, user, message})
    end
    
    @doc """
    Dequeues the next frame for the given user.
    """
    def dequeue_frame(server, user) do
        GenServer.call(server, {:dequeue, user})
    end
    
    @doc """
    Gets the internal state of the Server, for testing purposes.
    """
    def get_state(server) do
        GenServer.call(server, :state)
    end
    
    # ********************************
    # Server callbacks
    # ********************************
    
    # the state of this server will be a HashDict mapping user ids 
    # to a queue of frames.
    # A frame will contain any metadata about a particular frame received 
    # from the user, including the message payload.
    # User1 -> frame4   User2 -> frame4
    #       -> frame3         -> frame3
    #       -> frame2         -> frame2
    #       -> frame1         -> frame1
    def init(:ok) do
        Debug.log("GameServer  init")
        :timer.send_interval(5000, :refresh)
        {:ok, HashDict.new}
    end
    
    def handle_cast({:join, user}, state) do
        Debug.log("GameServer  handle_cast join " <> user)
        if !HashDict.has_key?(state, user) do
            state = HashDict.put(state, user, [])
        end
        {:noreply, state}
    end
    
    def handle_call({:message, user, message}, _from, state) do
        Debug.log("GameServer  handle_call message " <> user <> " : " <> message)
        frame_data = to_server_frame_translation(message)
        
        {:ok, state} = enqueue_message(state, user, frame_data)
        
        case process_queues(state) do
            {:ok, current_state} ->
                state = current_state
            {:broadcast, payload, current_state} ->
                state = current_state
        end
        
        {:reply, nil, state}
    end
    
    def handle_call({:dequeue, user}, _from, state) do
        Debug.log("GameServer  handle_cast dequeue " <> user)
        {:ok, frame, state} = dequeue_message(state, user)
        {:reply, frame, state}
    end
    
    def handle_call(:state, _from, state) do
        {:reply, state, state}
    end
    
    defp queues_ready?(state) do
        # for each user: check if the queue length is not-empty
        Enum.reduce(HashDict.keys(state), true, 
            fn(user, acc) -> 
                queue = HashDict.fetch!(state, user)
                length(queue) > 0 && acc 
            end)
    end
    
    #unused right now
    def handle_info(:refresh, state) do
        {:noreply, state}
    end
    
    
    # from client:
    # <id>|<timestamp>|<type>|<payload>|<eom>
    # payload = <frame>~,<input>,<input>
    
    # this.toServerMessageType = 
    #    {
    #        Debug: 0,
    #        Subscribe: 1,
    #        Unsubscribe: 2,
    #        QueueForMatch: 3,
    #        CancelQueueForMatch: 4,
    #        Frame: 5
    #    };
    
    # from server:
    # <id>|<timestamp>|<type>|<payload>|<eom>
    # when type = StartMatch, payload = random seed
    # when type = Frame, payload = 
    #   frame~,player,1,inputs~player,2,inputs
    
    # this.toClientMessageType = 
    #    {
    #        Debug: 0,
    #        StartMatch: 1,
    #        Frame: 2
    #    }
    
    # payload is in format
    # <frame>~,<input1>,<input2>
    @packet_delimiter "|"
    @frame_delimiter "~"
    @input_delimiter ","
    def to_server_frame_translation(payload) do
        split = String.split(payload, @frame_delimiter)        
        %{frame: List.first(split), inputs: List.last(split)}
    end
    
    def enqueue_message(state, user, message) do
        new_queue = HashDict.fetch!(state, user) ++ [message]
        state = HashDict.put(state, user, new_queue)
        {:ok, state}
    end
    
    def dequeue_message(state, user) do
        [frame | new_queue] = HashDict.fetch!(state, user)
        state = HashDict.put(state, user, new_queue)
        {:ok, frame, state}
    end
    
    def peek_message(state, user) do
        List.first(HashDict.fetch!(state, user))
    end
    
    def dequeue_and_form_payload(state) do
        # dequeue once for each user, and formulate a broadcast payload.
        # TODO someday have an ordering here, sort is bad.
        all_users = Enum.sort(HashDict.keys(state))
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
    
    def process_queues(state) do
        if(queues_ready?(state)) do
            {:ok, payload, state} = dequeue_and_form_payload(state)
            {:broadcast, payload, state}
        else
            {:ok, state}
        end
    end
end
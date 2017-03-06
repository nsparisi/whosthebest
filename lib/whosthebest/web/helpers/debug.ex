defmodule Whosthebest.Debug do
    
    @doc """
    Logs any type of message
    """
    def log(message) do         
        do_log message
    end
    @doc """
    Logs a message with an inspected object.
    very common to debug the contents of an object.
    """
    def log(message, object) do         
        do_log "#{message} #{inspect object}"
    end
    
    defp do_log(message) do
        IO.puts "[**debug**] #{inspect message}"
    end
    
    #**************************
    # All this convert_to_string is useless, but i'm keeping it anyway!
    #**************************
    def convert_to_string(object) when is_nil(object) do
        "nil"
    end
    
    def convert_to_string(object) when 
        is_atom(object) 
        or is_binary(object) 
        or is_bitstring(object) 
        or is_boolean(object) 
        or is_function(object) 
        or is_number(object) 
        or is_pid(object) 
        or is_port(object) 
        or is_reference(object) do
        
        to_string(object)
    end
    
    def convert_to_string(object) when is_function(object) do
        "CANNOT PRINT FUNCTION"
    end
    
    def convert_to_string(list) when is_list(list) do
        pretty = Enum.reduce(list, "", 
            fn(item, acc) ->
                acc <> convert_to_string(item) <> ", "
            end)
        "[" <> pretty <>"]"
    end
    
    def convert_to_string(map) when is_map(map) do
        pretty = Enum.reduce(Map.keys(map), "",
            fn(key, acc) -> 
                value = Map.fetch!(map, key)
                key_as_string = convert_to_string(key)
                value_as_string = convert_to_string(value)
                acc <> "" <> key_as_string <> " => " <> value_as_string <> ", "
            end)
       "%{"<> pretty <> "}"
    end
    
    def convert_to_string(object) when is_tuple(object) do
        convert_to_string Tuple.to_list(object)
    end
    
    def convert_to_string(_object) do
        "UNKNOWN OBJECT"
    end
end
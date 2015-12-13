defmodule Whosthebest.Debug do
    def log(message) do
        as_string = to_string(message)
        IO.inspect "[**debug**] " <> as_string
    end
end
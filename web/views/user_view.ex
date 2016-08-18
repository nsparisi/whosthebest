defmodule Whosthebest.UserView do
  use Whosthebest.Web, :view
  
  def user_name(user) do
    if user[:username] do
      String.capitalize(user[:username])
    else
      "mate"
    end
  end
  
end

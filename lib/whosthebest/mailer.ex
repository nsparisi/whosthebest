defmodule Whosthebest.Mailer do
  @moduledoc """
    Base mailer. Adds Bamboo mailer for sending mails.
  """
  use Bamboo.Mailer, otp_app: :whosthebest
end
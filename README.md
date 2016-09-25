# Prerequisites

  1. Elixir 1.3.2 with Erlang OTP 19
  2. Node JS 4.4.7 x64
  3. PostgreSQL 9.6.0 (user: postgres, pw: postgres)
  4. Python 2.7.12

# Whosthebest

To start your Phoenix app:

  1. Install node dependencies with `npm install`
  2. Install elixir dependencies with `mix deps.get`
  3. Create and migrate your database with `mix ecto.create && mix ecto.migrate`
  4. Build typescript game with `node node_modules/typescript/bin/tsc -p game_client/` or download VSCode and run ctrl+shift+b
  4. Start Phoenix endpoint with `mix phoenix.server`

For Windows Users:

  1. VC++ build tools http://landinghub.visualstudio.com/visual-cpp-build-tools
  2. To compile comeonin dependency, add `C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\bin\amd64` to PATH
  3. run `C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\vcvarsall.bat amd64`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

## Learn more

  * Official website: http://www.phoenixframework.org/
  * Guides: http://phoenixframework.org/docs/overview
  * Docs: http://hexdocs.pm/phoenix
  * Mailing list: http://groups.google.com/group/phoenix-talk
  * Source: https://github.com/phoenixframework/phoenix

::
::Run this file to initialize the environment on Windows
::

:: Load compiler env vars for windows
call "c:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\vcvarsall.bat" amd64

:: Install NPM - NodeJS package manager dependencies for this project
npm install

:: Get Mix dependencies
mix deps.get

:: Create and migrate the DB
mix ecto.create && mix ecto.migrate

echo "run 'mix phoenix.server' to start the server"
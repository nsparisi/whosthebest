module Whosthebest.Graphics
{
    export class Game_WhosTheBest extends Phaser.Game
    {
        LOGGED_IN_USERNAME: string;
        GAME_ID: string;
        OPPONENT_USERNAME: string;

        constructor()
        {
            super(480, 360, Phaser.AUTO, 'gameDiv');

            this.state.add("Boot", State_Boot);
            this.state.add("Preloader", State_Preloader);
            this.state.add("GameLobby", State_GameLobby);
            this.state.add("Game", State_Game);
            this.state.add("Menu", State_Menu);

            this.state.start("Boot");
        }

        refreshLobbyUsers = (usernames: Array<Array<string>>) =>
        {
            if(this.state.current == "Menu")
            {
                var menu = this.state.getCurrentState() as State_Menu;
                menu.refreshUsers(usernames);
            }
        }

        addLobbyChatMessage = (username: string, message: string) =>
        {
            if(this.state.current == "Menu")
            {
                var menu = this.state.getCurrentState() as State_Menu;
                menu.addChatMessage(username, message);
            }
        }

        receivedAsk = (from_username: string, to_username: string) =>
        {
            if(to_username != this.LOGGED_IN_USERNAME)
            {
                Debug.log("receivedAsk: Received invalid message.")
                return;
            }

            if(this.state.current == "Menu")
            {
                var menu = this.state.getCurrentState() as State_Menu;
                var response = window.confirm(`${from_username} has challenged you to a match!`);
                ServerTranslator.Instance.toServerRespondToUser(from_username, response);
            }
        }

        receivedResponse = (from_username: string, to_username: string, accepted: boolean) =>
        {
            if( to_username != this.LOGGED_IN_USERNAME &&
                from_username != this.LOGGED_IN_USERNAME)
            {
                Debug.log("receivedResponse: Received invalid message.")
                return;
            }            

            if(this.state.current == "Menu")
            {
                if(accepted)
                {
                    Debug.log("they accepted your invite!");
                }
                else
                {
                    Debug.log("they declined your invite!");
                }
            }
        }

        switchToGameLobby = (from_username: string, to_username: string, game_id: string) => 
        {
            if( to_username != this.LOGGED_IN_USERNAME &&
                from_username != this.LOGGED_IN_USERNAME)
            {
                Debug.log("receivedResponse: Received invalid message.")
                return;
            }   

            this.OPPONENT_USERNAME = 
                from_username != this.LOGGED_IN_USERNAME ? 
                from_username : 
                to_username;

            this.GAME_ID = game_id;
                            
            ServerTranslator.Instance.connectToGame(game_id);
            this.state.start("GameLobby");
        }

        switchToGame = (randomSeed: number) => 
        {
            this.state.start("Game");
            
            // TODO clean up, change to PHASER
            //MainControl.Instance.initialize();
            InputEngine.Instance.initialize(bodyElement);
            main = new Main();
            main.begin();
            MainControl.Instance.switchToGame(randomSeed, false);
        }

        switchToPractice = () =>
        {
            this.state.start("Game");
            InputEngine.Instance.initialize(bodyElement);
            MainControl.Instance.switchToGame(123456, true);
        }

        switchToMenu = () =>
        {
            MainControl.Instance.switchToMenu();
            this.state.start("Menu");
        }
    }
}
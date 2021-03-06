module Whosthebest.Graphics
{
    
    /**
     * This is the main entry point for the game which extends Phaser.Game.
     * This class is responsible for letting Phaser know about the html canvas to render in, 
     * all of the possible States which can be loaded and which State to start first.
     * 
     * @export
     * @class Game_WhosTheBest
     * @extends {Phaser.Game}
     */
    export class Game_WhosTheBest extends Phaser.Game
    {
        LOGGED_IN_USERNAME: string;
        GAME_ID: string;
        OPPONENT_USERNAME: string;
        USER_INDEX: number;

        constructor()
        {
            super(725, 525, Phaser.AUTO, 'gameDiv');

            this.state.add("Boot", State_Boot);
            this.state.add("Preloader", State_Preloader);
            this.state.add("Splash", State_Splash);
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

        switchToGameLobby = (from_username: string, to_username: string, game_id: string, game_token: string) => 
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
                            
            ServerTranslator.Instance.connectToGame(game_id, game_token);
            this.state.start("GameLobby");
        }

        switchToGame = (randomSeed: number, userIndex: number) => 
        {
            this.internalSwitchToGame(randomSeed, userIndex, false);
        }

        switchToPractice = () =>
        {
            var randomSeed = Math.random() * 100000;
            this.internalSwitchToGame(randomSeed, 0, true);
        }

        switchToWatch = () =>
        {
            var randomSeed = Math.random() * 100000;
            this.internalSwitchToGame(randomSeed, -1, true);
        }

        internalSwitchToGame = (randomSeed: number, userIndex: number, isPractice: boolean) =>
        {
            var player1 = Math.floor(randomSeed) % State_Game.NUMBER_OF_CHARACTERS;
            var player2 = Math.floor(randomSeed * randomSeed) % State_Game.NUMBER_OF_CHARACTERS;
            if(player2 == player1)
            { 
                player2 = (player2 + 1) % State_Game.NUMBER_OF_CHARACTERS; 
            } 

            this.USER_INDEX = userIndex;
            this.state.start(
                "Game",
                true, 
                false, 
                randomSeed,         // randomSeed parameter
                isPractice,         // isPracticeGame parameter
                [player1, player2]
            );
        }

        switchToMenu = () =>
        {
            this.state.start("Splash");
        }

        switchToGameOver = (winner: number) =>
        {
            var gameState = <State_Game>this.state.getCurrentState();
            gameState.switchToGameOver(winner);
        }
    }
}
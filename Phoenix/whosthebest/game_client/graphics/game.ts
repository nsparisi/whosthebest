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
            MainControl.Instance.switchToGame(randomSeed);
        }

        switchToMenu = () =>
        {
            this.state.start("Menu");
        }
    }

    export class State_Boot extends Phaser.State
    {
        preload()
        {
        }

        create()
        {
            // handle various game-wide settings, such as
            // any differences between mobile/desktop, screen scaling, etc.
            this.input.maxPointers = 1;
            this.stage.disableVisibilityChange = true;
            this.stage.backgroundColor = "#6495ED"

            // immediately jump to the preloader
            this.game.state.start("Preloader");
        }
    }

    export class State_Preloader extends Phaser.State
    {
        preloadText: Phaser.Text;

        preload()
        {
            this.preloadText = this.add.text(
                this.game.width / 2, 
                this.game.height /2,
                "Loading...", 
                {font: "bold 20pt Arial", fill: "#000"});
            this.preloadText.anchor.set(0.5);

            // Load all additional game assets from this screen
            // Can use this option to load all assets up front
            // May consider loading before a game, like starcraft
            this.load.spritesheet("images/menu/btn_back.png", "images/menu/btn_back.png", 51, 50);
            this.load.spritesheet("images/menu/btn_ready.png", "images/menu/btn_ready.png", 120, 52);
            this.load.spritesheet("images/menu/btn_friend.png", "images/menu/btn_friend.png", 120, 52);
            this.load.spritesheet("images/menu/btn_play.png", "images/menu/btn_play.png", 120, 52);
            this.load.spritesheet("images/menu/btn_quick.png", "images/menu/btn_quick.png", 120, 52);
            this.load.image("images/menu/img_avatar.png", "images/menu/img_avatar.png");
        }

        create()
        {
            GAME_INSTANCE.switchToMenu();
        }
    }

    export class State_Menu extends Phaser.State
    {
        buttonPlay: Phaser.Button;
        buttonQuick: Phaser.Button;
        buttonFriend: Phaser.Button;
        buttonBack: Phaser.Button;

        chatWindow: Phaser.Sprite;
        chatField: Phaser.Sprite;
        usersWindow: Phaser.Sprite;

        userGroup: Phaser.Group;
        userTexts: Array<Phaser.Text> = new Array();

        lobbyTextField: HTMLInputElement;
        lobbyChat: HTMLElement;
        lobbyUserList: HTMLElement;

        currentSelectedUserName: string;
        usernameList = new Array<string>();

        shutdown()
        {
            ServerTranslator.Instance.disconnectFromLobby();
            
            this.toggleHtmlElements(false);
        }

        create()
        {
            // TODO create this div here instead of keeping in html
            this.lobbyTextField =  <HTMLInputElement>document.getElementById("lobbyTextField");
            this.lobbyTextField.style.position = "absolute";
            this.lobbyTextField.style.marginLeft = "10px";
            this.lobbyTextField.style.marginTop = "320px";
            this.lobbyTextField.style.width = "350px";
            this.lobbyTextField.style.height = "30px";
            this.lobbyTextField.onkeyup = (event) => 
            {
                event.preventDefault();
                if(event.keyCode == 13 && this.lobbyTextField.value.length > 0)
                {
                    ServerTranslator.Instance.toServerLobbyMessage(this.lobbyTextField.value)
                    this.lobbyTextField.value = "";
                }
            }

            this.lobbyChat =  document.getElementById("lobbyChat");
            this.lobbyChat.style.position = "absolute";
            this.lobbyChat.style.marginLeft = "10px";
            this.lobbyChat.style.marginTop = "10px";
            this.lobbyChat.style.width = "350px";
            this.lobbyChat.style.height = "300px";
            this.lobbyChat.style.backgroundColor = "#ffffff";
            this.lobbyChat.style.overflowY = "auto";

            this.lobbyUserList =  document.getElementById("lobbyUserList");
            this.lobbyUserList.style.position = "absolute";
            this.lobbyUserList.style.marginLeft = "370px";
            this.lobbyUserList.style.marginTop = "10px";
            this.lobbyUserList.style.width = "100px";
            this.lobbyUserList.style.height = "300px";
            this.lobbyUserList.style.backgroundColor = "#ffffff";

            this.buttonPlay = this.add.button(
                this.game.width / 2 - 60, 
                60, 
                "images/menu/btn_play.png", this.play_pressed, this, 1, 0, 2);

            this.buttonBack = this.add.button(
                430, 
                315, 
                "images/menu/btn_back.png", this.back_pressed, this, 1, 0, 2);
            this.buttonQuick = this.add.button(
                310, 
                315, 
                "images/menu/btn_quick.png", this.quick_pressed, this, 1, 0, 2);
            this.buttonFriend = this.add.button(
                this.game.width / 2 - 60, 
                60 + 60, 
                "images/menu/btn_friend.png", this.friend_pressed, this, 1, 0, 2);

            // Example of creating a sprite using graphics tools
            // var graphics = this.add.graphics(0,0);
            // graphics.lineStyle(2, 0x222222, 1);
            // graphics.beginFill(0xFFFFFF, 1);
            // graphics.drawRect(0,0,290,300);
            // graphics.endFill();
            // this.chatWindow =  this.add.sprite(10,10, graphics.generateTexture());
            // graphics.destroy();

            this.showTitleMenu();
        }

        showTitleMenu = () =>
        {
            ServerTranslator.Instance.disconnectFromLobby();
            this.buttonPlay.exists = true;
            this.buttonBack.exists = false;
            this.buttonQuick.exists = false;
            this.buttonFriend.exists = false;

            this.toggleHtmlElements(false);
        }

        showLobbyMenu = () =>
        {
            ServerTranslator.Instance.connectToLobby();
            this.buttonPlay.exists = false;
            this.buttonBack.exists = true;
            this.buttonQuick.exists = true;
            this.buttonFriend.exists = false;
            
            this.toggleHtmlElements(true);
        }

        toggleHtmlElements = (toggle) =>
        {
            this.lobbyTextField.hidden = !toggle;
            this.lobbyChat.hidden = !toggle;
            this.lobbyUserList.hidden = !toggle;
        }

        back_pressed()
        {
            this.showTitleMenu();
        }

        play_pressed()
        {
            this.showLobbyMenu();
        }

        quick_pressed()
        {
            if(this.currentSelectedUserName != GAME_INSTANCE.LOGGED_IN_USERNAME)
            {
                ServerTranslator.Instance.toServerAskUser(this.currentSelectedUserName);
            }
        }

        friend_pressed()
        {
            // GAME_INSTANCE.switchToGameLobby();
        }

        clearChatMessages = () =>
        {
            // clear list
            while(this.lobbyChat.firstChild)
            {
                this.lobbyChat.removeChild(this.lobbyChat.firstChild);
            }
        }

        addSystemMessage = (message: string) =>
        {
            var usernameDiv = document.createElement("div");
            usernameDiv.innerHTML = "";
            usernameDiv.style.display = "inline";
            usernameDiv.style.cssFloat = "left";
            usernameDiv.style.padding = "0 10px 0 0";
            usernameDiv.style.fontStyle = "italic";
            usernameDiv.style.color = "#2255aa";

            var messageDiv = document.createElement("div");
            messageDiv.innerHTML = message;
            messageDiv.style.display = "inline";
            messageDiv.style.cssFloat = "left";
            messageDiv.style.fontStyle = "italic";
            messageDiv.style.color = "#3366cc";

            this.internalAddMessage([usernameDiv, messageDiv]);
        }

        addChatMessage = (username: string, message: string) =>
        {
            var usernameDiv = document.createElement("div");
            usernameDiv.innerHTML = username;
            usernameDiv.style.display = "inline";
            usernameDiv.style.cssFloat = "left";
            usernameDiv.style.padding = "0 10px 0 0";
            usernameDiv.style.color = "#6699ff";

            var messageDiv = document.createElement("div");
            messageDiv.innerHTML = message;
            messageDiv.style.display = "inline";
            messageDiv.style.cssFloat = "left";

            this.internalAddMessage([usernameDiv, messageDiv]);
        }

        refreshUsers = (usernames: Array<Array<string>>) =>
        {
            // clear list
            while(this.lobbyUserList.firstChild)
            {
                this.lobbyUserList.removeChild(this.lobbyUserList.firstChild);
            }

            // populate list
            var newUsernameList = new Array<string>();
            for(var username in usernames)
            {
                var userDiv = document.createElement("div");
                userDiv.style.backgroundColor = "#ffffff";
                userDiv.style.padding = "5px 0 0 5px";
                userDiv.innerHTML = username;
                userDiv.setAttribute("user_id", username);
                this.lobbyUserList.appendChild(userDiv);
                newUsernameList.push(username);

                userDiv.onclick = this.userNameOnClick;
            }

            // figure out users that joined
            for(var username of newUsernameList)
            {
                if(GAME_INSTANCE.LOGGED_IN_USERNAME != username &&
                    this.usernameList.indexOf(username) == -1)
                {
                    this.addSystemMessage(`${username} has come online.`)
                }
            }
            
            // figure out users that left
            for(var username of this.usernameList)
            {
                if(GAME_INSTANCE.LOGGED_IN_USERNAME != username &&
                    newUsernameList.indexOf(username) == -1)
                {
                    this.addSystemMessage(`${username} has gone offline.`)
                }
            }

            this.usernameList = newUsernameList;
        }

        private userNameOnClick = (event: MouseEvent) =>
        {
            for(var i = 0; i < this.lobbyUserList.children.length; i++)
            { 
                var childElement = (<HTMLElement>this.lobbyUserList.children.item(i));
                childElement.style.backgroundColor = "#ffffff";
            }

            var clickedDiv = <HTMLElement>event.target;
            clickedDiv.style.backgroundColor = "#aaaaaa";
            this.currentSelectedUserName = clickedDiv.getAttribute("user_id");
        }
        
        private internalAddMessage = (messageDivs: Array<HTMLElement>) =>
        {
            // check if the chat is scrolled to the bottom
            var shouldScroll = false;
            var maxScroll = this.lobbyChat.scrollHeight - parseInt(this.lobbyChat.style.height);
            if(maxScroll == this.lobbyChat.scrollTop)
            {
                shouldScroll = true;
            }

            // create a container for the chat row
            var rowDiv = document.createElement("div");
            rowDiv.style.padding = "5px 0 0 5px";
            rowDiv.style.clear = "both";
            
            // add the chat message elements to the row
            for(var messageDiv of messageDivs)
            {
                rowDiv.appendChild(messageDiv);
            }
            this.lobbyChat.appendChild(rowDiv);
            
            // scroll the chat box automatically
            if(shouldScroll)
            {
                rowDiv.scrollIntoView();
            }
        }
    }

    export class State_GameLobby extends Phaser.State
    {
        buttonBack: Phaser.Button;
        buttonReady: Phaser.Button;
        spriteAvatar1: Phaser.Sprite;
        spriteAvatar2: Phaser.Sprite;
        
        textName1: Phaser.Text;
        textName2: Phaser.Text;
        textStatus1: Phaser.Text;
        textStatus2: Phaser.Text;
        textCountdown: Phaser.Text;
        textTitle: Phaser.Text;

        create()
        {
            this.spriteAvatar1 = this.add.sprite(13, 78, "images/menu/img_avatar.png");
            this.spriteAvatar2 = this.add.sprite(0, 78, "images/menu/img_avatar.png");
            this.spriteAvatar2.x = this.game.width - 13 - this.spriteAvatar2.width;

            this.buttonBack = this.add.button(
                13, 300, "images/menu/btn_back.png", this.back_pressed, this, 1, 0, 2);
            this.buttonReady = this.add.button(
                this.game.width / 2 - 60, 
                this.game.height - 60, 
                "images/menu/btn_ready.png", this.ready_pressed, this, 1, 0, 2);
                
            this.textTitle = this.add.text(
                this.game.width / 2, 
                5, 
                "VS", 
                {font: "40pt Arial", fill: "#000"});
            this.textTitle.anchor.set(0.5, 0);

            this.textName1 = this.add.text(
                13, 
                57,
                GAME_INSTANCE.LOGGED_IN_USERNAME, 
                {font: "12pt Arial", fill: "#000"});
            this.textName1.anchor.set(0, 0);
                
            this.textName2 = this.add.text(
                this.game.width - 13, 
                57,
                GAME_INSTANCE.OPPONENT_USERNAME, 
                {font: "12pt Arial", fill: "#000"});
            this.textName2.anchor.set(1, 0);
                
            this.textStatus1 = this.add.text(
                13 + this.spriteAvatar1.width / 2, 
                260,
                "Waiting...", 
                {font: "bold 12pt Arial", fill: "#000"});
            this.textStatus1.anchor.set(0.5, 0);
                
            this.textStatus2 = this.add.text(
                this.game.width - 13 - this.spriteAvatar2.width / 2, 
                260,
                "Waiting...", 
                {font: "bold 12pt Arial", fill: "#000"});
            this.textStatus2.anchor.set(0.5, 0);
                
            this.textCountdown = this.add.text(
                this.game.width / 2, 
                this.game.height / 2,
                "3", 
                {font: "bold 40pt Arial", fill: "#000"});
            this.textCountdown.anchor.set(0.5, 0.5);
        }

        back_pressed()
        {
            ServerTranslator.Instance.disconnectFromGame();
            GAME_INSTANCE.switchToMenu();
        }

        ready_pressed()
        {
            ServerTranslator.Instance.toServerGameReady();
        }
    }

    export class State_Game extends Phaser.State
    {
        textTitle: Phaser.Text;

        create()
        {
            // this.textTitle = this.add.text(
            //     this.game.width / 2, 
            //     5, 
            //     "Play Game", 
            //     {font: "40pt Arial", fill: "#000"});
            // this.textTitle.anchor.set(0.5, 0);
            
            canvasElement.hidden = false;
        }

        shutdown()
        {
            canvasElement.hidden = true;
            ServerTranslator.Instance.disconnectFromGame();
        }
    }
}
module Whosthebest.Graphics
{
    /**
     * This is the state "Menu" which inherits from Phaser.State.
     * Here we have the splash screen for the game or the title menu, as well as the chat lobby. 
     * 
     * @export
     * @class State_Menu
     * @extends {Phaser.State}
     */
    export class State_Menu extends Phaser.State
    {
        buttonInvite: Phaser.Button;
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

        create()
        {
            // the back button will go back to the splash menu
            this.buttonBack = this.add.button(
                25, 
                25, 
                "images/menu/btn_back.png", this.back_pressed, this, 1, 0, 2);

            // the invite button will send an invite request to the selected online player.
            this.buttonInvite = this.add.button(
                583, 
                463, 
                "images/menu/btn_invite.png", this.invite_pressed, this, 1, 0, 2);

            // The chat lobby contains a few HTML elements which are created as part of the page's template.
            // Here, we are manipulating the style and function of these elements.
            this.lobbyTextField =  <HTMLInputElement>document.getElementById("lobbyTextField");
            this.lobbyTextField.style.position = "absolute";
            this.lobbyTextField.style.marginLeft = "25px";
            this.lobbyTextField.style.marginTop = "463px";
            this.lobbyTextField.style.width = "533px";
            this.lobbyTextField.style.height = "42px";

            // check for when the enter key is pressed in the text field.
            // this will send the message to the server
            this.lobbyTextField.onkeyup = (event) => 
            {
                event.preventDefault();
                if(event.keyCode == 13 && this.lobbyTextField.value.length > 0)
                {
                    ServerTranslator.Instance.toServerLobbyMessage(this.lobbyTextField.value)
                    this.lobbyTextField.value = "";
                }
            }

            // lobbyChat is the chat history pane
            this.lobbyChat =  document.getElementById("lobbyChat");
            this.lobbyChat.style.position = "absolute";
            this.lobbyChat.style.marginLeft = "25px";
            this.lobbyChat.style.marginTop = "92px";
            this.lobbyChat.style.width = "533px";
            this.lobbyChat.style.height = "346px";
            this.lobbyChat.style.backgroundColor = "#ffffff";
            this.lobbyChat.style.overflowY = "auto";

            // lobbyUserList contains a list of online users
            this.lobbyUserList =  document.getElementById("lobbyUserList");
            this.lobbyUserList.style.position = "absolute";
            this.lobbyUserList.style.marginLeft = "583px";
            this.lobbyUserList.style.marginTop = "92px";
            this.lobbyUserList.style.width = "122px";
            this.lobbyUserList.style.height = "346px";
            this.lobbyUserList.style.backgroundColor = "#ffffff";

            // connect to the server lobby channel
            ServerTranslator.Instance.connectToLobby();

            // show the HTML elements
            this.toggleHtmlElements(true);

            // play the menu music BGM
            SOUND_MANAGER.playMusic("audio/music/bgm_main_menu.mp3");
        }

        shutdown()
        {
            // need to handle any non-phaser-controlled 
            // state which may persist between game states.
            ServerTranslator.Instance.disconnectFromLobby();
            this.toggleHtmlElements(false);
        }

        /**
         * Enables or disables HTML the elements on the page by altering the class and CSS styling.
         * 
         * @memberOf State_Menu
         */
        toggleHtmlElements = (toggle) =>
        {
            this.lobbyTextField.className = toggle ? "game-lobby-visible" : "game-lobby-hidden";
            this.lobbyChat.className = toggle ? "game-lobby-visible" : "game-lobby-hidden";
            this.lobbyUserList.className = toggle ? "game-lobby-visible" : "game-lobby-hidden";
        }

        /**
         * Callback for the back button. Navigates to the splash screen.
         * 
         * @memberOf State_Menu
         */
        back_pressed()
        {
            this.game.state.start("Splash");
        }


        /**
         * Callback for the invite button. 
         * Sends an invite request to the server for the selected user. 
         * Users are selected in the user panel.
         * 
         * 
         * @memberOf State_Menu
         */
        invite_pressed()
        {
            if( this.currentSelectedUserName != null &&
                this.currentSelectedUserName != GAME_INSTANCE.LOGGED_IN_USERNAME)
            {
                ServerTranslator.Instance.toServerAskUser(this.currentSelectedUserName);
            }
        }

        /**
         * Adds a system message to the chat window. 
         * System events are things like users leaving and joining the channel.
         * 
         * 
         * @memberOf State_Menu
         */
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

        /**
         * Adds a user chat message to the chat window.
         * 
         * 
         * @memberOf State_Menu
         */
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

        /**
         * Refreshes the user list and prints system messages in the chat window.
         * 
         * 
         * @memberOf State_Menu
         */
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
            clickedDiv.style.backgroundColor = "#faec7f";
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
}
module Whosthebest.Graphics
{
    export class State_Menu extends Phaser.State
    {
        buttonPlay: Phaser.Button;
        buttonPractice: Phaser.Button;
        buttonWatch: Phaser.Button;
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
            this.lobbyTextField.style.marginLeft = "25px";
            this.lobbyTextField.style.marginTop = "463px";
            this.lobbyTextField.style.width = "533px";
            this.lobbyTextField.style.height = "42px";
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
            this.lobbyChat.style.marginLeft = "25px";
            this.lobbyChat.style.marginTop = "92px";
            this.lobbyChat.style.width = "533px";
            this.lobbyChat.style.height = "346px";
            this.lobbyChat.style.backgroundColor = "#ffffff";
            this.lobbyChat.style.overflowY = "auto";

            this.lobbyUserList =  document.getElementById("lobbyUserList");
            this.lobbyUserList.style.position = "absolute";
            this.lobbyUserList.style.marginLeft = "583px";
            this.lobbyUserList.style.marginTop = "92px";
            this.lobbyUserList.style.width = "122px";
            this.lobbyUserList.style.height = "346px";
            this.lobbyUserList.style.backgroundColor = "#ffffff";

            this.buttonPlay = this.add.button(
                this.game.width / 2 - 100, 
                254, 
                "images/menu/btn_play.png", this.play_pressed, this, 1, 0, 2);

            this.buttonPractice = this.add.button(
                this.game.width / 2 - 100, 
                334, 
                "images/menu/btn_practice.png", this.practice_pressed, this, 1, 0, 2);

            this.buttonWatch = this.add.button(
                this.game.width / 2 - 100, 
                414, 
                "images/menu/btn_watch.png", this.watch_pressed, this, 1, 0, 2);

            this.buttonBack = this.add.button(
                25, 
                25, 
                "images/menu/btn_back.png", this.back_pressed, this, 1, 0, 2);

            this.buttonInvite = this.add.button(
                583, 
                463, 
                "images/menu/btn_invite.png", this.invite_pressed, this, 1, 0, 2);

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
            GAME_INSTANCE.playMusic("audio/music/bgm_main_menu.mp3");
        }

        showTitleMenu = () =>
        {
            ServerTranslator.Instance.disconnectFromLobby();
            this.buttonPlay.exists = true;
            this.buttonPractice.exists = true;
            this.buttonWatch.exists = true;
            this.buttonBack.exists = false;
            this.buttonInvite.exists = false;
            this.buttonFriend.exists = false;

            this.toggleHtmlElements(false);
        }

        showLobbyMenu = () =>
        {
            ServerTranslator.Instance.connectToLobby();
            this.buttonPlay.exists = false;
            this.buttonPractice.exists = false;
            this.buttonWatch.exists = false;
            this.buttonBack.exists = true;
            this.buttonInvite.exists = true;
            this.buttonFriend.exists = false;
            
            this.toggleHtmlElements(true);
        }

        toggleHtmlElements = (toggle) =>
        {
            this.lobbyTextField.className = toggle ? "game-lobby-visible" : "game-lobby-hidden";
            this.lobbyChat.className = toggle ? "game-lobby-visible" : "game-lobby-hidden";
            this.lobbyUserList.className = toggle ? "game-lobby-visible" : "game-lobby-hidden";
        }

        back_pressed()
        {
            this.showTitleMenu();
        }

        play_pressed()
        {
            this.showLobbyMenu();
        }

        practice_pressed()
        {
            GAME_INSTANCE.switchToPractice();
        }

        watch_pressed()
        {
            GAME_INSTANCE.switchToWatch();
        }

        invite_pressed()
        {
            if( this.currentSelectedUserName != null &&
                this.currentSelectedUserName != GAME_INSTANCE.LOGGED_IN_USERNAME)
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
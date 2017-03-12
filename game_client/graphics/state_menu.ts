module Whosthebest.Graphics
{
    export class State_Menu extends Phaser.State
    {
        imageLogo: Phaser.Sprite;

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
        
        tileWidth = 25;
        columns: Array<Phaser.Group>;
        timeSinceLastTile = 0;
        isTitleMenu = true;

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

            this.imageLogo = this.add.sprite(
                this.game.width / 2, 
                25, 
                "images/menu/img_logo.png");
            this.imageLogo.anchor.x = 0.5;

            // title menu logic for tile effect
            // create phaser groups as "columns"
            var numberOfColumns = Math.ceil(this.game.width / 25);
            this.columns = [];
            for(var i = 0; i < numberOfColumns; i++)
            {
                this.columns.push(this.add.group());
                this.columns[i].x = i * this.tileWidth;
            }

            // prepopulate a bunch of columns with tiles
            var fillColumn = (col: number, count: number) =>
            {
                for(var i = 0; i < count; i++)
                {
                    this.addTile(col, this.game.height);
                }
            }

            fillColumn(0, 5);
            fillColumn(1, 10);
            fillColumn(2, 7);
            fillColumn(3, 4);
            fillColumn(4, 3);
            fillColumn(5, 4);
            fillColumn(6, 8);
            fillColumn(7, 3);
            fillColumn(8, 1);
            fillColumn(numberOfColumns - 9, 1);
            fillColumn(numberOfColumns - 8, 3);
            fillColumn(numberOfColumns - 7, 3);
            fillColumn(numberOfColumns - 6, 5);
            fillColumn(numberOfColumns - 5, 8);
            fillColumn(numberOfColumns - 4, 6);
            fillColumn(numberOfColumns - 3, 3);
            fillColumn(numberOfColumns - 2, 10);
            fillColumn(numberOfColumns - 1, 7);

            // Example of creating a sprite using graphics tools
            // var graphics = this.add.graphics(0,0);
            // graphics.lineStyle(2, 0x222222, 1);
            // graphics.beginFill(0xFFFFFF, 1);
            // graphics.drawRect(0,0,290,300);
            // graphics.endFill();
            // this.chatWindow =  this.add.sprite(10,10, graphics.generateTexture());
            // graphics.destroy();

            this.showTitleMenu();
            SOUND_MANAGER.playMusic("audio/music/bgm_main_menu.mp3");
        }

        showTitleMenu = () =>
        {
            ServerTranslator.Instance.disconnectFromLobby();
            this.isTitleMenu = true;
            this.imageLogo.exists = true;
            this.buttonPlay.exists = true;
            this.buttonPractice.exists = true;
            this.buttonWatch.exists = true;
            this.buttonBack.exists = false;
            this.buttonInvite.exists = false;

            this.toggleHtmlElements(false);
        }

        showLobbyMenu = () =>
        {
            ServerTranslator.Instance.connectToLobby();
            this.isTitleMenu = false;
            this.imageLogo.exists = false;
            this.buttonPlay.exists = false;
            this.buttonPractice.exists = false;
            this.buttonWatch.exists = false;
            this.buttonBack.exists = true;
            this.buttonInvite.exists = true;
            this.toggleHtmlElements(true);

            this.columns.forEach(
                (column) =>
                {
                    column.children.forEach(
                        (tile)=>
                        {
                            (<TitleTile>tile).kill();
                        });

                    column.removeChildren();
                });
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
        
        update()
        {
            if(!this.isTitleMenu)
            {
                return;
            }

            // every couple of seconds 
            // drop a tile onto the title menu
            this.timeSinceLastTile += this.time.elapsedMS;
            if(this.timeSinceLastTile > 3000)
            {
                this.timeSinceLastTile -= 3000;

                var col = 8;
                while(col > 7 && col < 21)
                {
                    col = this.game.rnd.integerInRange(0, this.columns.length - 1);;
                }

                this.addTile(col, -50);
            }
            
            this.columns.forEach(
                (column) =>
                {
                    column.children.forEach(
                        (tile)=>
                        {
                            (<TitleTile>tile).fall();
                        });
                });
        }

        addTile = (col: number, y: number) =>
        {
            var type = this.game.rnd.integerInRange(0, 4);
            var destinationY = this.game.height - (this.columns[col].length * this.tileWidth) - this.tileWidth;
            var titleTile = new TitleTile(this.game, 0, y, State_Game.TILE_SPRITE_KEYS[type]);
            titleTile.initialize(destinationY, 0.7);
            this.columns[col].add(titleTile);
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
    

    class TitleTile extends Phaser.Sprite
    {
        destinationY: number;
        speed: number;

        initialize = (destinationY: number, speed: number) =>
        {
            this.destinationY = destinationY;
            this.speed = speed;
        }

        fall = () =>
        {
            this.y += this.game.time.elapsed * this.speed;
            if(this.y >= this.destinationY)
            {
                this.y = this.destinationY;
            }
        }
    }
}
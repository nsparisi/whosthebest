module Whosthebest.Graphics
{
    export class Game_WhosTheBest extends Phaser.Game
    {
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

        switchToGameLobby = () => 
        {
            this.state.start("GameLobby");
        }

        switchToGame = () => 
        {
            this.state.start("Game");
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


        refreshUsers = (usernames: Array<Array<string>>) =>
        {
            var x = this.usersWindow.x + 10;
            var y = this.usersWindow.y + 10;
            var y_offset = 15;

            for (var userText of this.userTexts) 
            {
                userText.destroy();   
            }
            
            this.userTexts = new Array();

            var index = 0;
            for (var username in usernames) 
            {
                var userText = this.add.text(
                        x, 
                        y + index * y_offset,
                        username, 
                        {font: "bold 10pt Arial", fill: "#000"});
                this.userTexts.push(userText);
                this.userGroup.add(userText);
                    
                index++;
            }
        }

        create()
        {
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

            var graphics = this.add.graphics(0,0);
            graphics.lineStyle(2, 0x222222, 1);
            graphics.beginFill(0xFFFFFF, 1);
            graphics.drawRect(0,0,290,300);
            graphics.endFill();
            this.chatWindow =  this.add.sprite(10,10, graphics.generateTexture());
            graphics.destroy();

            graphics = this.add.graphics(0,0);
            graphics.lineStyle(2, 0x222222, 1);
            graphics.beginFill(0xFFFFFF, 1);
            graphics.drawRect(0,0,160,300);
            graphics.endFill();
            this.usersWindow =  this.add.sprite(310,10, graphics.generateTexture());
            graphics.destroy();
            
            graphics = this.add.graphics(0,0);
            graphics.lineStyle(2, 0x222222, 1);
            graphics.beginFill(0xFFFFFF, 1);
            graphics.drawRect(0,0,290,30);
            graphics.endFill();
            this.chatField =  this.add.sprite(10,320, graphics.generateTexture());
            graphics.destroy();            

            this.userGroup = this.add.group();

            this.showTitleMenu();
        }

        showTitleMenu = () =>
        {
            ServerTranslator.Instance.disconnectFromLobby();
            this.buttonPlay.exists = true;
            this.buttonBack.exists = false;
            this.buttonQuick.exists = false;
            this.buttonFriend.exists = false;
            this.chatWindow.exists = false;
            this.usersWindow.exists = false;
            this.chatField.exists = false;
            this.userGroup.visible = false;
        }

        showLobbyMenu = () =>
        {
            ServerTranslator.Instance.connectToLobby();
            this.buttonPlay.exists = false;
            this.buttonBack.exists = true;
            this.buttonQuick.exists = true;
            this.buttonFriend.exists = false;
            this.chatWindow.exists = true;
            this.usersWindow.exists = true;
            this.chatField.exists = true;
            this.userGroup.visible = true;
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
        }

        friend_pressed()
        {
            GAME_INSTANCE.switchToGameLobby();
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
                "ScarramangaScarramanga", 
                {font: "12pt Arial", fill: "#000"});
            this.textName1.anchor.set(0, 0);
                
            this.textName2 = this.add.text(
                this.game.width - 13, 
                57,
                "PositronicPositronic", 
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
            GAME_INSTANCE.switchToMenu();
        }

        ready_pressed()
        {
        }
    }

    export class State_Game extends Phaser.State
    {
        textTitle: Phaser.Text;

        create()
        {
            this.textTitle = this.add.text(
                this.game.width / 2, 
                5, 
                "Play Game", 
                {font: "40pt Arial", fill: "#000"});
            this.textTitle.anchor.set(0.5, 0);
        }
    }
}
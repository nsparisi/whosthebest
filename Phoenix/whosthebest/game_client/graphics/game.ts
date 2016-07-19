module Whosthebest
{
    export class Game_WhosTheBest extends Phaser.Game
    {
        constructor()
        {
            super(480, 360, Phaser.AUTO, 'gameDiv');

            this.state.add("Boot", State_Boot);
            this.state.add("Preloader", State_Preloader);
            this.state.add("GameLobby", State_GameLobby);

            this.state.start("Boot");
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
            this.load.spritesheet("images/GameLobby/btn_back.png", "images/GameLobby/btn_back.png", 51, 50);
            this.load.spritesheet("images/GameLobby/btn_ready.png", "images/GameLobby/btn_ready.png", 120, 52);
            this.load.image("images/GameLobby/img_avatar.png", "images/GameLobby/img_avatar.png");
        }

        create()
        {
            this.game.state.start("GameLobby")
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
            this.spriteAvatar1 = this.add.sprite(13, 78, "images/GameLobby/img_avatar.png");
            this.spriteAvatar2 = this.add.sprite(0, 78, "images/GameLobby/img_avatar.png");
            this.spriteAvatar2.x = this.game.width - 13 - this.spriteAvatar2.width;

            this.buttonBack = this.add.button(
                13, 300, "images/GameLobby/btn_back.png", this.back_pressed, this, 1, 0, 2);
            this.buttonReady = this.add.button(
                this.game.width / 2 - 60, 
                this.game.height - 60, 
                "images/GameLobby/btn_ready.png", this.ready_pressed, this, 1, 0, 2);
                
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
            Debug.log("State_GameLobby back_pressed")
        }

        ready_pressed()
        {
            Debug.log("State_GameLobby ready_pressed")
        }
    }
}
module Whosthebest.Graphics
{
    /**
     * This is the state "GameLobby" which inherits from Phaser.State.
     * This state is the staging area for players in a game to ready-up, choose avatars, add friends etc.
     * For now the functionality is very limited, the only option is to ready for the game.
     * 
     * @export
     * @class State_GameLobby
     * @extends {Phaser.State}
     */
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
            this.spriteAvatar1 = this.add.sprite(25, 135, "images/menu/img_YellowCatAvatar.png");
            this.spriteAvatar2 = this.add.sprite(0, 135, "images/menu/img_GreenCatAvatar.png");
            this.spriteAvatar2.x = this.game.width - 25 - this.spriteAvatar2.width;

            this.buttonBack = this.add.button(
                25, 25, "images/menu/btn_back.png", this.back_pressed, this, 1, 0, 2);
            this.buttonReady = this.add.button(
                this.game.width / 2 - 100, 
                this.game.height - 95, 
                "images/menu/btn_ready.png", this.ready_pressed, this, 1, 0, 2);
                
            this.textTitle = this.add.text(
                this.game.width / 2, 
                203, 
                "VS", 
                {font: "40pt Arial", fill: "#fff"});
            this.textTitle.anchor.set(0.5, 0);

            this.textName1 = this.add.text(
                25, 
                92,
                GAME_INSTANCE.LOGGED_IN_USERNAME, 
                {font: "12pt Arial", fill: "#fff"});
            this.textName1.anchor.set(0, 0);
                
            this.textName2 = this.add.text(
                this.game.width - 25, 
                92,
                GAME_INSTANCE.OPPONENT_USERNAME, 
                {font: "12pt Arial", fill: "#fff"});
            this.textName2.anchor.set(1, 0);
                
            this.textStatus1 = this.add.text(
                25 + this.spriteAvatar1.width / 2, 
                325,
                "Waiting...", 
                {font: "bold 12pt Arial", fill: "#fff"});
            this.textStatus1.anchor.set(0.5, 0);
                
            this.textStatus2 = this.add.text(
                this.game.width - 25 - this.spriteAvatar2.width / 2, 
                325,
                "Waiting...", 
                {font: "bold 12pt Arial", fill: "#fff"});
            this.textStatus2.anchor.set(0.5, 0);
                
            this.textCountdown = this.add.text(
                this.game.width / 2, 
                355,
                "3", 
                {font: "bold 40pt Arial", fill: "#fff"});
            this.textCountdown.anchor.set(0.5, 0.5);
        }

        shutdown()
        {
            // TODO(nick) consider letting the server know if this player disconnected
            // but that logic should probably be done via some heartbeat
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
}
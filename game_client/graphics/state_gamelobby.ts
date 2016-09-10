module Whosthebest.Graphics
{
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
}
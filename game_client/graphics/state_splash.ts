module Whosthebest.Graphics
{
    /**
     * This is the state "Splash" which inherits from Phaser.State.
     * Here we have the splash screen for the game AKA the title menu.
     * 
     * @export
     * @class State_Menu
     * @extends {Phaser.State}
     */
    export class State_Splash extends Phaser.State
    {
        imageLogo: Phaser.Sprite;

        buttonPlay: Phaser.Button;
        buttonPractice: Phaser.Button;
        buttonWatch: Phaser.Button;
        
        tileWidth = 25;
        columns: Array<Phaser.Group>;
        timeSinceLastTile = 0;

        create()
        {
            this.imageLogo = this.add.sprite(
                this.game.width / 2, 
                25, 
                "images/menu/img_logo.png");
            this.imageLogo.anchor.x = 0.5;

            // the play button will navigate to the chat lobby
            this.buttonPlay = this.add.button(
                this.game.width / 2 - 100, 
                254, 
                "images/menu/btn_play.png", this.play_pressed, this, 1, 0, 2);

            // the practice button will navigate to a game against the AI
            this.buttonPractice = this.add.button(
                this.game.width / 2 - 100, 
                334, 
                "images/menu/btn_practice.png", this.practice_pressed, this, 1, 0, 2);

            // the watch button will navigate to a game of AI vs AI (just for fun :))
            this.buttonWatch = this.add.button(
                this.game.width / 2 - 100, 
                414, 
                "images/menu/btn_watch.png", this.watch_pressed, this, 1, 0, 2);

            // The splash screen has a simple tile-dropping effect.
            // Here we have a number of Phaser.Group's set up to be our tile columns to match the width of the game.
            var numberOfColumns = Math.ceil(this.game.width / 25);
            this.columns = [];
            for(var i = 0; i < numberOfColumns; i++)
            {
                this.columns.push(this.add.group());
                this.columns[i].x = i * this.tileWidth;
            }

            // prepopulate a bunch of columns with tiles, 
            // so the splash screen starts out looking nice.
            this.fillColumn(0, 5);
            this.fillColumn(1, 10);
            this.fillColumn(2, 7);
            this.fillColumn(3, 4);
            this.fillColumn(4, 3);
            this.fillColumn(5, 4);
            this.fillColumn(6, 8);
            this.fillColumn(7, 3);
            this.fillColumn(8, 1);
            this.fillColumn(numberOfColumns - 9, 1);
            this.fillColumn(numberOfColumns - 8, 3);
            this.fillColumn(numberOfColumns - 7, 3);
            this.fillColumn(numberOfColumns - 6, 5);
            this.fillColumn(numberOfColumns - 5, 8);
            this.fillColumn(numberOfColumns - 4, 6);
            this.fillColumn(numberOfColumns - 3, 3);
            this.fillColumn(numberOfColumns - 2, 10);
            this.fillColumn(numberOfColumns - 1, 7);

            // play the menu music BGM
            SOUND_MANAGER.playMusic("audio/music/bgm_main_menu.mp3");
        }

        play_pressed()
        {
            this.game.state.start("Menu");
        }

        practice_pressed()
        {
            GAME_INSTANCE.switchToPractice();
        }

        watch_pressed()
        {
            GAME_INSTANCE.switchToWatch();
        }
        
        update()
        {
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

        /**
         * Fills-in a number of tiles up-front for the given column.
         *
         * @memberOf State_Splash
         */
        fillColumn = (col: number, count: number) =>
        {
            for(var i = 0; i < count; i++)
            {
                this.addTile(col, this.game.height);
            }
        }

        /**
         * Adds a tile to the column starting at the provided y coordinate.
         * 
         * @memberOf State_Splash
         */
        addTile = (col: number, y: number) =>
        {
            var type = this.game.rnd.integerInRange(0, 4);
            var destinationY = this.game.height - (this.columns[col].length * this.tileWidth) - this.tileWidth;
            var titleTile = new TitleTile(this.game, 0, y, State_Game.TILE_SPRITE_KEYS[type]);
            titleTile.initialize(destinationY, 0.6);
            this.columns[col].add(titleTile);
        }
    }
    

    /**
     * TitleTile provides some simple logic for a falling tile on the splash screen.
     * These tiles will simply fall until they reach their destination Y coordinate.
     * 
     * @class TitleTile
     * @extends {Phaser.Sprite}
     */
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
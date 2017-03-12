module Whosthebest.Graphics
{
    export class State_Preloader extends Phaser.State
    {
        preloadText: Phaser.Text;

        preload()
        {
            this.preloadText = this.add.text(
                this.game.width / 2, 
                this.game.height /2,
                "Loading...", 
                {font: "bold 20pt Arial", fill: "#fff"});
            this.preloadText.anchor.set(0.5);

            // Load all additional game assets from this screen
            // Can use this option to load all assets up front
            // May consider loading before a game, like starcraft

            // Title menu
            this.load.image("images/menu/img_logo.png", "images/menu/img_logo.png");

            this.load.spritesheet("images/menu/btn_back.png", "images/menu/btn_back.png", 122, 42);
            this.load.spritesheet("images/menu/btn_invite.png", "images/menu/btn_invite.png", 122, 42);
            this.load.spritesheet("images/menu/btn_quit.png", "images/menu/btn_quit.png", 122, 42);
            this.load.spritesheet("images/menu/btn_ready.png", "images/menu/btn_ready.png", 200, 70);
            this.load.spritesheet("images/menu/btn_play.png", "images/menu/btn_play.png", 200, 70);
            this.load.spritesheet("images/menu/btn_practice.png", "images/menu/btn_practice.png", 200, 70);
            this.load.spritesheet("images/menu/btn_watch.png", "images/menu/btn_watch.png", 200, 70);

            this.load.spritesheet("images/menu/btn_sfx.png", "images/menu/btn_sfx.png", 25, 25);
            this.load.spritesheet("images/menu/btn_music.png", "images/menu/btn_music.png", 25, 25);
            this.load.spritesheet("images/menu/btn_controller.png", "images/menu/btn_controller.png", 25, 25);

            this.load.image("images/menu/img_avatar.png", "images/menu/img_avatar.png");            
            this.load.image("images/menu/img_YellowCatAvatar.png", "images/menu/img_YellowCatAvatar.png");            
            this.load.image("images/menu/img_BlueCatAvatar.png", "images/menu/img_BlueCatAvatar.png");            
            this.load.image("images/menu/img_PinkCatAvatar.png", "images/menu/img_PinkCatAvatar.png");            
            this.load.image("images/menu/img_OrangeCatAvatar.png", "images/menu/img_OrangeCatAvatar.png");        
            this.load.image("images/menu/img_GreenCatAvatar.png", "images/menu/img_GreenCatAvatar.png");

            this.load.spritesheet("images/sprites/ss_cloyster.png", "images/sprites/ss_cloyster.png", 68, 68);
            this.load.spritesheet("images/sprites/ss_growlithe.png", "images/sprites/ss_growlithe.png", 47, 49);
            this.load.spritesheet("images/sprites/ss_pikachu.png", "images/sprites/ss_pikachu.png", 176, 176);
            this.load.spritesheet("images/sprites/ss_poliwhirl.png", "images/sprites/ss_poliwhirl.png", 58, 46);
            this.load.spritesheet("images/sprites/ss_psyduck.png", "images/sprites/ss_psyduck.png", 36, 45);
            this.load.spritesheet("images/sprites/ss_raichu.png", "images/sprites/ss_raichu.png", 66, 55);
            this.load.spritesheet("images/sprites/ss_squirtle.png", "images/sprites/ss_squirtle.png", 39, 38);
            this.load.spritesheet("images/sprites/ss_weepinbell.png", "images/sprites/ss_weepinbell.png", 42, 40);

            this.load.audio("audio/cloyster_intense.mp3","audio/cloyster_intense.mp3");
            this.load.audio("audio/cloyster_mild.mp3", "audio/cloyster_mild.mp3");
            this.load.audio("audio/growlithe_intense.mp3","audio/growlithe_intense.mp3");
            this.load.audio("audio/growlithe_mild.mp3", "audio/growlithe_mild.mp3");
            this.load.audio("audio/pikachu_intense.mp3","audio/pikachu_intense.mp3");
            this.load.audio("audio/pikachu_mild.mp3", "audio/pikachu_mild.mp3");
            this.load.audio("audio/poliwhirl_intense.mp3","audio/poliwhirl_intense.mp3");
            this.load.audio("audio/poliwhirl_mild.mp3", "audio/poliwhirl_mild.mp3");
            this.load.audio("audio/psyduck_intense.mp3","audio/psyduck_intense.mp3");
            this.load.audio("audio/psyduck_mild.mp3", "audio/psyduck_mild.mp3");
            this.load.audio("audio/raichu_intense.mp3","audio/raichu_intense.mp3");
            this.load.audio("audio/raichu_mild.mp3", "audio/raichu_mild.mp3");
            this.load.audio("audio/squirtle_intense.mp3","audio/squirtle_intense.mp3");
            this.load.audio("audio/squirtle_mild.mp3", "audio/squirtle_mild.mp3");
            this.load.audio("audio/weepinbell_intense.mp3","audio/weepinbell_intense.mp3");
            this.load.audio("audio/weepinbell_mild.mp3", "audio/weepinbell_mild.mp3");
            
            this.load.audio("audio/music/bgm_game_1.mp3", "audio/music/bgm_game_1.mp3");
            this.load.audio("audio/music/bgm_lose_match.mp3", "audio/music/bgm_lose_match.mp3");
            this.load.audio("audio/music/bgm_main_menu.mp3", "audio/music/bgm_main_menu.mp3");

            this.load.audio("audio/game/sfx_block_drop.mp3", "audio/game/sfx_block_drop.mp3");
            this.load.audio("audio/game/sfx_block_pop.mp3", "audio/game/sfx_block_pop.mp3");
            this.load.audio("audio/game/sfx_cursor_move.mp3", "audio/game/sfx_cursor_move.mp3");

            // load all TILE assets
            for(var i = 0; i < State_Game.TILE_SPRITE_KEYS.length; i++)
            {
                this.load.spritesheet(
                    State_Game.TILE_SPRITE_KEYS[i], 
                    State_Game.TILE_SPRITE_KEYS[i], 
                    25, 25);
            }
        }

        sfxMuted = false;
        bgmMuted = false;

        buttonSfxMute: Phaser.Button;
        buttonBgmMute: Phaser.Button;
        spriteGamePad: Phaser.Sprite;

        create()
        {
            // create upper-corner buttons which persist across game states
            // persistence is kept by adding to the game.stage
            this.buttonBgmMute = this.game.make.button(
                this.game.width - 25, 
                25, 
                "images/menu/btn_music.png", this.bgm_pressed, this, 1, 0, 2)
            this.buttonBgmMute.anchor.x = 1;
            this.game.stage.addChild(this.buttonBgmMute);

            this.buttonSfxMute = this.game.make.button(
                this.buttonBgmMute.x - 25 - 12, 
                25, 
                "images/menu/btn_sfx.png", this.sfx_pressed, this, 1, 0, 2)
            this.buttonSfxMute.anchor.x = 1;
            this.game.stage.addChild(this.buttonSfxMute);

            this.spriteGamePad = this.game.make.sprite(
                this.buttonSfxMute.x - 25 - 12, 
                25,
                "images/menu/btn_controller.png");
            this.spriteGamePad.anchor.x = 1;
            this.game.stage.addChild(this.spriteGamePad);
            this.spriteGamePad.frame =  this.input.gamepad.pad1.connected ? 0 : 2;

            // done with preloader, switch to splash screen
            GAME_INSTANCE.switchToMenu();
        }

        sfx_pressed()
        {
            this.sfxMuted = !this.sfxMuted;
            SOUND_MANAGER.muteSfx(this.sfxMuted);

            if(this.sfxMuted)
            {
                this.buttonSfxMute.setFrames(2, 2, 0);
            }
            else 
            {
                this.buttonSfxMute.setFrames(1, 0, 2);
            }
        }

        bgm_pressed()
        {
            this.bgmMuted = !this.bgmMuted;
            SOUND_MANAGER.muteBgm(this.bgmMuted);

            if(this.bgmMuted)
            {
                this.buttonBgmMute.setFrames(2, 2, 0);
            }
            else 
            {
                this.buttonBgmMute.setFrames(1, 0, 2);
            }
        }
    }
}
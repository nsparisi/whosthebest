module Whosthebest.Graphics
{
    export class SoundManager
    {
        MUSIC: Phaser.Sound;

        bgmVolume = 1;
        sfxVolume = 1;

        playMusic = (filename: string) =>
        {
            if(this.MUSIC && this.MUSIC.key == filename)
            {
                return;
            }

            if(this.MUSIC)
            {
                this.MUSIC.stop();
                this.MUSIC.destroy();
            }

            this.MUSIC = GAME_INSTANCE.add.audio(filename);
            this.MUSIC.play(null, null, this.bgmVolume, true, false);
        }

        playSfx = (sfxHandle: Phaser.Sound) =>
        {
            sfxHandle.play(null, null, this.sfxVolume, false, false);
        }

        muteBgm = (mute: boolean) =>
        {
            this.bgmVolume = mute ? 0 : 1;

            if(this.MUSIC)
            {
                this.MUSIC.volume = this.bgmVolume;
            }
        }

        muteSfx = (mute: boolean) =>
        {
            this.sfxVolume = mute ? 0 : 1;
        }
    }
}
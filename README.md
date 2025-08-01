# Random Map App (RMA)

Inspired by the "RMC" plugin in Trackmania, this App automatically loads players
into random Dustforce custom levels, and the goal is to score as many points in
a given time limit. SS completions score 1 point each, and Any%'ing gives a free
skip for that level.

There's various settings to change the random level set and the rules of your
runs. Notable features include:
- Change the level set by various filters. For example, filter out CMP levels, set a minimum SS count, and determine average level length by what the World Record time can at max be.
- Get any range of free starting skips, up to infinite. Or, get a free skip each time you successfully SS a number of levels.
- A standard list of modes, some of which have their own leaderboard on [Speedrun.com](https://www.speedrun.com/dustforce_dx).
- Personal Best tracking per standard mode.
- Review segment times at the end of each run, and compare splits with your Personal Best.
- Race other people with set seeds; download and import settings to ease the setup.

---

#### [Installation](#installation-heading)

#### [FAQ](#faq-heading)

#### [Leaderboard Submissions](#leaderboard-submissions-heading)

## <a id="installation-heading"></a> Installation

*Requirements*

- Have Dustforce with [Dustmod](http://dustmod.com/) installed.

*Steps*
- Download one of the [releases](https://github.com/ukkiez/Dustforce-random-map-app/releases) for your Operating System, and run the executable within the downloaded folder.

*MacOS*

If you are on MacOS, put the app (`random-map-app`) in your Applications folder.

## <a id="faq-heading"></a> FAQ
> *Can I update my level set?*

Not at the moment - level sets are static in RMA versions. This is in part because different level sets completely change seeds, which would make set-seed races between people more of a hassle to set up. This also keeps runs on the leaderboards more consistent, and prevents [Dustkid.com](https://dustkid.com) from being potentially flooded with requests.

Maybe this will change in the future.

---
> *Can I block/prevent levels from showing up in runs?*

There is no option to block specific levels - this is part of the challenge! This also keeps runs on the leaderboards more balanced.

If the levels you encounter are generally too hard/annoying for you, consider tweaking settings like "Minimum SS Count", or giving yourself more skips to work with. *Note: this would invalidate leaderboard runs.*

___
> *Why does RMA need to know my Dustforce folder location?*

In order to be as responsive as possible, RMA does not fetch data from [Dustkid.com](https://dustkid.com), but instead monitors the `split.txt` file locally to determine whether you've completed levels and the completion score you got for them. This file is a feature from Dustmod, which consistently updates it after each level completion.

Most of the time RMA can find the folder location automatically. However, if the installation is in an unexpected location then you'll have to follow the instructions in the App. This amounts to just selecting your Dustforce folder, or any folder within it. You'll only need to do this the first time you open RMA.

---
> *RMA does not recognize I'm completing levels - what do I do?*

Make sure when you start Dustforce, you do it manually and not have it automatically open via a link (e.g. opening a Dustkid replay, or pressing Install & Play on Atlas). At the time of writing this, there is a bug in Dustmod that doing so will not update `split.txt`.

If you did so, and the issue persists, perhaps have a look at `split.txt` in your local Dustforce folder and see if it's accurate.

Otherwise, please send me a message on Discord.

___
> *I have a different issue that's not mentioned here.*

Please send a message to "Ukkiez" on Discord. You can find my exact profile in the Dustforce Discord Server.

## <a id="leaderboard-submissions-heading"></a> Leaderboard Submissions
There's currently two [leaderboards](https://www.speedrun.com/dustforce_dx?h=random-map-challenge-classic&x=xd1p77zd-rn1ygm1n.qyz44r21), for the built-in Classic and Blitz Modes. Submissions require a VOD, from the time of starting your run to when the score screen comes up.

Speedrun.com does not support scores, so we have to use time instead. Your final score (number of SS completions) are your minutes, and your skips remaining are the seconds (important for ties!). For example: if you get a final score of 14, and you have 2 skips remaining, your submission time is `14m 2s`.

# Random Map App (RMA)

Inspired by the "RMC" plugin in Trackmania, this app automatically loads players into
random Dustforce custom levels. Where in Trackmania Author Medals give 1 point
and Gold Medals give free skips, here it's SS'ing and Any%'ing levels.

The level pool itself can be altered via various configurable settings, which
also includes other settings that change the rules of the game. The settings
consist of things such as:
- Filter levels by minimum SS count
- Filter levels by fastest WR SS time (and below)
- How many free starting skips are given to players
- Set seeds for racing

And some more.

---

#### [Installation](#installation)

#### [FAQ](#faq)

## Installation

- Download one of the releases for your Operating System, and run the executable within the downloaded folder.

#### Requirements

- Have Dustforce with [Dustmod](http://dustmod.com/) installed.

## FAQ
> *Can I update my level set?*

Not at the moment - level sets are static in RMA versions. This is in part because different level sets completely change seeds, which would make set-seed races between people more of a hassle to set up. This also keeps runs on the leaderboards more consistent, and prevents [Dustkid.com](https://dustkid.com) from being potentially flooded with requests. Maybe this will change in the future.

---
> *Can I block/prevent levels I loathe from showing up in runs?*

You cannot block specific levels - this is part of the challenge! This also keeps runs on the leaderboards more balanced.

If the levels you encounter are generally too hard/annoying for you, consider tweaking settings like "Minimum SS Count", or giving yourself more skips to work with.

___
> *Why does RMA need to know my Dustforce folder location?*

In order to be as responsive as possible, RMA does not fetch data from [Dustkid.com](https://dustkid.com), but instead monitors the `split.txt` file locally to determine whether you've completed levels and the completion score you got for them. This file is a feature from Dustmod, which constantly updates it throughout playing.

Most of the time, RMA can find it automatically. But if the installation is in an unexpected location, you'll have to follow the instructions in the App. This amounts to simply opening your Dustforce folder, or any folder within it.

---
> *RMA does not recognize I'm completing levels*

Make sure when you start Dustforce, you do it manually and not have it automatically open via a link (e.g. opening a Dustkid replay, or pressing Install & Play on Atlas). At the time of writing this, there is a bug in Dustmod that doing so will not update `split.txt`.

If you did so, and the issue persists, perhaps have a look at `split.txt` in your local Dustforce folder and see if it's accurate.

Otherwise, please send me a message on Discord.

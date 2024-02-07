# Random Map App (RMA)

Inspired by the "RMC" plugin in Trackmania, this App automatically loads players
into random Dustforce custom levels, and the goal is to score as many points in
a given time limit. SS completions score 1 point each, and Any%'ing gives a free
skip for that level.

There's various settings to change the random level set and the rules of your
runs. Features include:
- Filtering levels by minimum SS count
- Filtering levels by fastest WR SS time (and below)
- How many free starting skips are given to players
- Set seeds for racing

And some more.

---

#### [Installation](#installation)

#### [FAQ](#faq)

## Installation

*Requirements*

- Have Dustforce with [Dustmod](http://dustmod.com/) installed.

*Steps*
- Download one of the releases for your Operating System, and run the executable within the downloaded folder.


## FAQ
> *Can I update my level set?*

Not at the moment - level sets are static in RMA versions. This is in part because different level sets completely change seeds, which would make set-seed races between people more of a hassle to set up. This also keeps runs on the leaderboards more consistent, and prevents [Dustkid.com](https://dustkid.com) from being potentially flooded with requests.

Maybe this will change in the future.

---
> *Can I block/prevent levels I loathe from showing up in runs?*

You cannot block specific levels - this is part of the challenge! This also keeps runs on the leaderboards more balanced.

If the levels you encounter are generally too hard/annoying for you, consider tweaking settings like "Minimum SS Count", or giving yourself more skips to work with.

___
> *Why does RMA need to know my Dustforce folder location?*

In order to be as responsive as possible, RMA does not fetch data from [Dustkid.com](https://dustkid.com), but instead monitors the `split.txt` file locally to determine whether you've completed levels and the completion score you got for them. This file is a feature from Dustmod, which consistently updates it after each level completion.

Most of the time RMA can find it automatically. However, if the installation is in an unexpected location then you'll have to follow the instructions in the App. This amounts to just selecting your Dustforce folder, or any folder within it. You'll only need to do this the first time you open RMA.

---
> *RMA does not recognize I'm completing levels - what do I do?*

Make sure when you start Dustforce, you do it manually and not have it automatically open via a link (e.g. opening a Dustkid replay, or pressing Install & Play on Atlas). At the time of writing this, there is a bug in Dustmod that doing so will not update `split.txt`.

If you did so, and the issue persists, perhaps have a look at `split.txt` in your local Dustforce folder and see if it's accurate.

Otherwise, please send me a message on Discord.

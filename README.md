# SillyTavern-Lucid Support Extension

Basic support for internal [DreamGen's Lucid](https://huggingface.co/dreamgen/lucid-v1-nemo) multi-character support.

## Features

Currently this extension allows the user to tag character as narrators and assistants, and fit those roles as expected by Lucid model. It also adds a `/ooc` slash command to send *ooc instructions* to Lucid. There's still no support for Lucid auto character selection, so it uses SillyTavern internal character selection.

The story string from the provided preset probably isn't optimal, but it looks to work well enough.

There's no support for *Chat Completion*, only for *Text Completion*.

## Installation and Usage

### Installation

This extension is compatible with the native SillyTavern extension installer, from the *Extensions panel*.

Once installed, there's a `preset.json` in the repository that includes a set of Advanced Formatting and Completion Preset settings that I found fits the model very well. It's based on the oficial Lucid recommendations, but it's adapted to SillyTavern and this extension nuances. This preset can be set from the *Master Import* button in the Advanced Formatting tab.

### Usage

For fully using this extension features, you should have at least a narrator character card with a narrator tag (`lucid_narrator` by default), an assistant character card with an assistant tag (`lucid_assistant` by default), and you'll probably want one or more regular character cards. You'll want to make a group with all of those together, and I would recommend to mute at least the assistant character (and possibly the narrator), as SillyTavern won't be able to correctly manage them.

Additionally you can use the `/ooc {message}` slash command to send OOC instructions to the model. Those messages will show as from a pseudo-character with its own name and profile picture. In a future those may be configurable, but not right now.

## Prerequisites

This extension was developed targeting SillyTavern v1.12.14 (2025-04-21).
There are no additional requirements.

## Support and Contributions

I'll leave the issue tracker open, and I'll try to fix bugs from time to time. But have in mind this is a hobbie project, and support isn't going to be a priority.

I'll be accepting pull requests for stuff, but if anyone is planning on big improvements, consider just forking the project.

## License

This extension is licensed as GPLv3 as stated in LICENSE.md file.

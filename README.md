# SillyTavern-Lucid Support Extension

This extension provides basic support for internal [DreamGen's Lucid](https://huggingface.co/dreamgen/lucid-v1-nemo) multi-character capabilities.

## Features

Currently, this extension enables users to tag characters as narrators and assistants, allowing them to function as expected by the Lucid model. It also introduces a `/ooc` slash command to send out-of-character (OOC) instructions to Lucid. Note that there is no support for Lucid's automatic character selection, so it relies on SillyTavern's internal character selection.

The story string from the provided preset may not be optimal but seems to work effectively. This extension supports only _Text Completion_, not _Chat Completion_.

## Installation and Usage

### Installation

This extension is compatible with the native SillyTavern extension installer via the _Extensions panel_. Once installed, you will find a `preset.json` file in the repository that includes a set of Advanced Formatting and Completion Preset settings. These settings are tailored to fit the Lucid model well and are based on the official Lucid recommendations, adapted for SillyTavern and this extension. You can set this preset using the _Master Import_ button in the Advanced Formatting tab.

### Usage

To fully utilize this extension's features, you should have at least one narrator character card with a narrator tag (`lucid_narrator` by default) and one assistant character card with an assistant tag (`lucid_assistant` by default). You may also want one or more regular character cards. Group these characters together, and it is recommended to mute at least the assistant character (and possibly the narrator) since SillyTavern may not manage them correctly.

Additionally, you can use the `/ooc {message}` slash command to send OOC instructions to the model. These messages will appear as if sent by a pseudo-character with its own name and profile picture. Future updates may allow configuration of these pseudo-characters, but this feature is not available at present.

## Prerequisites

This extension was developed for SillyTavern v1.12.14 (released on 2025-04-21). There are no additional requirements.

## Support and Contributions

The issue tracker is open, and I will endeavor to fix bugs as time permits. Please note that this is a hobby project, and support will not be a priority.

Pull requests for improvements are welcome. However, if you are planning significant enhancements, consider forking the project.

## License

This extension is licensed under GPLv3, as stated in the LICENSE.md file.

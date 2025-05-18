// The main script for the extension

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { SlashCommandArgument, ARGUMENT_TYPE } from '../../../slash-commands/SlashCommandArgument.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced, event_types, eventSource, sendMessageAsUser } from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name
const oocImagePath = "img/ooc.png";
const extensionName = "SillyTavern-Lucid";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
  narratorTag: "lucid_narrator",
  assistantTag: "lucid_assistant"
};

function onPromptGenerated(data) {
  const context = getContext();

  const lucidNarratorTag = context.tags.find((value) => { return value.name == extensionSettings.narratorTag; });
  const lucidNarratorTagId = lucidNarratorTag ? lucidNarratorTag.id : null;
  const lucidAssistantTag = context.tags.find((value) => { return value.name == extensionSettings.assistantTag; });
  const lucidAssistantTagId = lucidAssistantTag ? lucidAssistantTag.id : null;

  let messages = data.finalMesSend;
  let oocRE = new RegExp(`<\\|start_header_id\\|>writer character ([^<]+)<\\|end_header_id\\|>([\\n\\r]*)\\(\\(Out-of-Character\\)\\)`);
  let generalRE = new RegExp(`<\\|start_header_id\\|>writer character ([^<]+)<\\|end_header_id\\|>`, "g");

  for (let index = 0; index < messages.length; index++) {
    let currentMessage = messages[index];

    if (lucidNarratorTagId || lucidAssistantTagId) {
      let match = generalRE.exec(currentMessage.message);
      while (match) {
        const characterName = match[1];
        const character = context.characters.find((value) => { return value.name == characterName; });
        if (!character) {
          match = generalRE.exec(currentMessage.message);
          continue;
        }

        const tags = context.tagMap[character.avatar];

        if (tags.includes(lucidNarratorTagId)) {
          currentMessage.message = currentMessage.message.replace(match[0], "<|start_header_id|>writer narration<|end_header_id|>")
        } else if (tags.includes(lucidAssistantTagId)) {
          currentMessage.message = currentMessage.message.replace(match[0], "<|start_header_id|>assistant<|end_header_id|>")
        }

        match = generalRE.exec(currentMessage.message);
      }
    }

    let match = currentMessage.message.match(oocRE);
    while (match) {
      currentMessage.message = currentMessage.message.replace(oocRE, "<|start_header_id|>user<|end_header_id|>$2")
      match = currentMessage.message.match(oocRE);
    }
  }
}

function onChatUpdated(messageId) {
  let context = getContext();
  let chat = $("#chat .mes");

  chat.each((index, mes) => {
    let messageId = Number($(mes).attr("mesid"));
    let chatSpec = context.chat[messageId];

    if (chatSpec.is_user && !chatSpec.is_system && chatSpec.mes.startsWith("((Out-of-Character))")) {
      // Change is_user attribute for styling purposes
      $(mes).attr("is_user", "false");

      // Remove ((Out-of-Character)) mark
      let message = $(mes).find(".mes_text").children("p").first();
      let messageHTML = message.html();
      messageHTML = messageHTML.replace("((Out-of-Character))<br>", "");
      message.html(messageHTML);

      // Change character name to "Out of Character"
      $(mes).find(".name_text").text("Out of Character");

      // Change avatar to ooc image
      let avatarImg = $(mes).find(".avatar img");
      let occPath = "/" + extensionFolderPath + "/" + oocImagePath;
      avatarImg.attr("src", occPath);
    }
  });
}

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  for (let property in defaultSettings) {
    if (extensionSettings[property] === undefined) {
      extensionSettings[property] = defaultSettings[property];
    }
  }

  $("#narrator_tag_setting").prop("value", extensionSettings.narratorTag);
  $("#assistant_tag_setting").prop("value", extensionSettings.assistantTag);
}

function onNarratorTagChanged(event) {
  extensionSettings.narratorTag = $(event.target).prop("value");
  saveSettingsDebounced();
}

function onAssistantTagChanged(event) {
  extensionSettings.assistantTag = $(event.target).prop("value");
  saveSettingsDebounced();
}

function runOOCSlashCommand(namedArgs, unnamedArgs) {
  let message = "((Out-of-Character))\n" + unnamedArgs.toString();
  sendMessageAsUser(message);
  return message;
}

function setupOOCSlashCommand() {
  SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'out-of-character',
    callback: runOOCSlashCommand,
    aliases: ['ooc'],
    returns: 'sends an out-of-character message formatted for Lucid LLM',
    namedArgumentList: [],
    unnamedArgumentList: [
      SlashCommandArgument.fromProps({
        description: 'the message to send',
        typeList: ARGUMENT_TYPE.STRING,
        isRequired: true,
      }),
    ],
    helpString: `
        <div>
            Sends an out-of-character message to the model.
        </div>
        <div>
            <strong>Example:</strong>
            <ul>
                <li>
                    <pre><code class="language-stscript">/ooc Be more clever</code></pre>
                    returns "???"
                </li>
                <li>
                    <pre><code class="language-stscript">/ooc Stop responding with long messages</code></pre>
                    returns "???"
                </li>
            </ul>
        </div>
    `,
  }));
}

// This function is called when the extension is loaded
jQuery(async () => {
  // This is an example of loading HTML from a file
  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);

  // Append settingsHtml to extensions_settings
  // extension_settings and extensions_settings2 are the left and right columns of the settings menu
  // Left should be extensions that deal with system functions and right should be visual/UI related 
  $("#extensions_settings").append(settingsHtml);

  // Load settings when starting things up (if you have any)
  loadSettings();
  $("#narrator_tag_setting").on("input", onNarratorTagChanged);
  $("#assistant_tag_setting").on("input", onAssistantTagChanged);

  setupOOCSlashCommand();

  eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, onPromptGenerated);
  eventSource.on(event_types.MORE_MESSAGES_LOADED, onChatUpdated);
  eventSource.on(event_types.CHAT_CHANGED, onChatUpdated);
  eventSource.on(event_types.MESSAGE_SWIPED, onChatUpdated);
  eventSource.on(event_types.MESSAGE_SENT, onChatUpdated);
  eventSource.on(event_types.MESSAGE_RECEIVED, onChatUpdated);
  eventSource.on(event_types.MESSAGE_EDITED, onChatUpdated);
  eventSource.on(event_types.MESSAGE_DELETED, onChatUpdated);
  eventSource.on(event_types.MESSAGE_UPDATED, onChatUpdated);
  eventSource.on(event_types.USER_MESSAGE_RENDERED, onChatUpdated);
});


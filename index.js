import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { SlashCommandArgument, ARGUMENT_TYPE } from '../../../slash-commands/SlashCommandArgument.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { saveSettingsDebounced, event_types, eventSource, sendMessageAsUser } from "../../../../script.js";

const oocImagePath = "img/ooc.png";
const oocToken = "((Out-of-Character))";
const oocCharacterName = "Out of Character";
const extensionName = "Lucid-ST";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
  narratorTag: "lucid_narrator",
  assistantTag: "lucid_assistant"
};

let extensionSettings = extension_settings[extensionName];

/**
 * Finds and replaces all narrator, assistant and ooc headers with those expected by Lucid, in all historic messages.
 * This only supports text completion APIs.
 *
 * @param {object} ST pre-generation data object.
 */
function onPromptGenerated(data) {
  const context = getContext();

  // Resolve narrator and assistant tags
  const lucidNarratorTag = context.tags.find((value) => { return value.name == extensionSettings.narratorTag; });
  const lucidNarratorTagId = lucidNarratorTag ? lucidNarratorTag.id : null;
  const lucidAssistantTag = context.tags.find((value) => { return value.name == extensionSettings.assistantTag; });
  const lucidAssistantTagId = lucidAssistantTag ? lucidAssistantTag.id : null;

  // Prepare regular expressions
  const escapedOocToken = oocToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let oocRE = new RegExp(`<\\|start_header_id\\|>writer character ([^<]+)<\\|end_header_id\\|>([\\n\\r]*)${escapedOocToken}`);
  let generalRE = new RegExp(`<\\|start_header_id\\|>writer character ([^<]+)<\\|end_header_id\\|>`, "g");

  // Iterate messages and replace headers as needed
  let messages = data.finalMesSend;
  for (let index = 0; index < messages.length; index++) {
    let currentMessage = messages[index];

    tryToReplaceSpecialCharacters(currentMessage, lucidNarratorTagId, lucidAssistantTagId, generalRE, context);
    tryToReplaceOOC(currentMessage, oocRE);
  }
}

/**
 * Replaces all found narrator and assistant headers with those expected by Lucid.
 *
 * @param {object} messageBox An object containing a message field with the raw message string. (In/Out parameter)
 * @param {string} narratorTag Character tag that identifies a character as a narrator.
 * @param {string} assistantTag Character tag that identifies a character as a assistant.
 * @param {RegExp} regex Regular expression which matches all character headers.
 * @param {object} ST context object.
 */
function tryToReplaceSpecialCharacters(messageBox, narratorTag, assistantTag, regex, context) {
  if (narratorTag || assistantTag) {
    // Find message start
    let match = regex.exec(messageBox.message);

    while (match) {
      // Find which character is owner of the message
      const characterName = match[1];
      const character = context.characters.find((value) => { return value.name == characterName; });
      if (!character) {
        // Couldn't find a valid character as owner. Skipping. This shouldn't happen.
        match = regex.exec(messageBox.message);
        continue;
      }

      // Get owner character tags
      const tags = context.tagMap[character.avatar];

      // Replace header according to character's tags
      if (tags.includes(narratorTag)) {
        messageBox.message = messageBox.message.replace(match[0], "<|start_header_id|>writer narrative<|end_header_id|>")
      } else if (tags.includes(assistantTag)) {
        messageBox.message = messageBox.message.replace(match[0], "<|start_header_id|>assistant<|end_header_id|>")
      }

      // Find next message start
      match = regex.exec(messageBox.message);
    }
  }
}

/**
 * Replaces all found ooc headers with the one expected by Lucid.
 *
 * @param {object} messageBox An object containing a message field with the raw message string. (In/Out parameter)
 * @param {RegExp} regex The regular expression which matches every OOC header+token.
 */
function tryToReplaceOOC(messageBox, regex) {
  // Find message start
  let match = messageBox.message.match(regex);

  while (match) {
    // Replace ooc header and token
    messageBox.message = messageBox.message.replace(regex, "<|start_header_id|>user<|end_header_id|>$2")

    // Find next message start
    match = messageBox.message.match(regex);
  }
}

/**
 * Updates the chat UI replacing raw ooc messages with the expected appearance.
 * Only alters user messages prefixed with the OOC token.
 */
function onChatUpdated(_) {
  const context = getContext();

  // Iterate through all chat messages
  let chat = $("#chat .mes");
  chat.each((index, mes) => {
    const messageId = Number($(mes).attr("mesid"));
    const chatSpec = context.chat[messageId];

    // Only process user, non-system, messages starting with the OOC token
    if (chatSpec.is_user && !chatSpec.is_system && chatSpec.mes.startsWith(oocToken)) {
      // Change is_user attribute for styling purposes
      $(mes).attr("is_user", "false");

      // Remove ((Out-of-Character)) mark
      let message = $(mes).find(".mes_text").children("p").first();
      let messageHTML = message.html();
      messageHTML = messageHTML.replace(`${oocToken}<br>`, "");
      message.html(messageHTML);

      // Change character name to "Out of Character"
      $(mes).find(".name_text").text(oocCharacterName);

      // Change avatar to ooc image
      let avatarImg = $(mes).find(".avatar img");
      const occPath = "/" + extensionFolderPath + "/" + oocImagePath;
      avatarImg.attr("src", occPath);
    }
  });
}

/**
 * Loads the stored extension settings and initializes unset values.
 */
async function loadSettings() {
  // Initialize unset settings with their default values
  for (let property in defaultSettings) {
    if (extensionSettings[property] === undefined) {
      extensionSettings[property] = defaultSettings[property];
    }
  }

  // Set current settings values to the settings UI.
  $("#narrator_tag_setting").prop("value", extensionSettings.narratorTag);
  $("#assistant_tag_setting").prop("value", extensionSettings.assistantTag);
}

/**
 * Updates the narrator tag setting.
 */
function onNarratorTagChanged(event) {
  extensionSettings.narratorTag = $(event.target).prop("value");
  saveSettingsDebounced();
}

/**
 * Updates the assistant tag setting.
 */
function onAssistantTagChanged(event) {
  extensionSettings.assistantTag = $(event.target).prop("value");
  saveSettingsDebounced();
}

/**
 * Actual OOC slash command execution.
 * Just prepends the OOC token before the user message.
 */
function runOOCSlashCommand(_, unnamedArgs) {
  const message = `${oocToken}\n` + unnamedArgs.toString();
  sendMessageAsUser(message);
  return message;
}

/**
 * Sets up the OOC slash command.
 * This is just ST slash command configuration.
 */
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

/**
 * Extension initialization
 */
jQuery(async () => {
  // Get our settings UI node
  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);

  // Paste our settings UI
  $("#extensions_settings").append(settingsHtml);

  // Handle settings loading and saving
  loadSettings();
  $("#narrator_tag_setting").on("input", onNarratorTagChanged);
  $("#assistant_tag_setting").on("input", onAssistantTagChanged);

  // Setup ooc slash command
  setupOOCSlashCommand();

  // Set hook to alter prompt headers just before LLM generation request
  eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, onPromptGenerated);

  // Set hooks to alter the user chat UI by replacing and formatting OOC messages correctly
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


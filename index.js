// The main script for the extension

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced, event_types, eventSource } from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name
const extensionName = "SillyTavern-Lucid";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
  narrator_substr: "narrator",
  assistant_substr: "assistant"
};

eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, (data) => {
  let messages = data.finalMesSend;
  let narratorRE = new RegExp(`<\\|start_header_id\\|>writer character (.*${extensionSettings.narrator_substr}[^<]*)<\\|end_header_id\\|>`);
  let assistantRE = new RegExp(`<\\|start_header_id\\|>writer character (.*${extensionSettings.assistant_substr}[^<]*)<\\|end_header_id\\|>`);
  let oocRE = new RegExp(`<\\|start_header_id\\|>writer character ([^<]+)<\\|end_header_id\\|>([\\n\\r]*)\\(\\(Out-of-Character\\)\\)`);

  for (let index = 0; index < messages.length; index++) {
    let currentMessage = messages[index];

    let match = currentMessage.message.match(narratorRE);
    while (match) {
      currentMessage.message = currentMessage.message.replace(narratorRE, "<|start_header_id|>writer narration<|end_header_id|>")
      match = currentMessage.message.match(narratorRE);
    }

    match = currentMessage.message.match(assistantRE);
    while (match) {
      currentMessage.message = currentMessage.message.replace(assistantRE, "<|start_header_id|>assistant<|end_header_id|>")
      match = currentMessage.message.match(assistantRE);
    }

    match = currentMessage.message.match(oocRE);
    while (match) {
      currentMessage.message = currentMessage.message.replace(oocRE, "<|start_header_id|>user<|end_header_id|>$2")
      match = currentMessage.message.match(oocRE);
    }
  }
});

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  for (let property in defaultSettings) {
    if (extensionSettings[property] === undefined) {
      extensionSettings[property] = defaultSettings[property];
    }
  }

  // Updating settings in the UI
  $("#narrator_substr_setting").prop("value", extensionSettings.narrator_substr);
  $("#assistant_substr_setting").prop("value", extensionSettings.assistant_substr);
}

function onNarratorSubstrChanged(event) {
  extensionSettings.narrator_substr = $(event.target).prop("value");
  saveSettingsDebounced();
}

function onAssistantSubstrChanged(event) {
  extensionSettings.assistant_substr = $(event.target).prop("value");
  saveSettingsDebounced();
}

// This function is called when the extension is loaded
jQuery(async () => {
  // This is an example of loading HTML from a file
  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);

  // Append settingsHtml to extensions_settings
  // extension_settings and extensions_settings2 are the left and right columns of the settings menu
  // Left should be extensions that deal with system functions and right should be visual/UI related 
  $("#extensions_settings").append(settingsHtml);

  // These are examples of listening for events
  $("#narrator_substr_setting").on("input", onNarratorSubstrChanged);
  $("#assistant_substr_setting").on("input", onAssistantSubstrChanged);

  // Load settings when starting things up (if you have any)
  loadSettings();
});


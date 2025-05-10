// The main script for the extension

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced, event_types, eventSource } from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name
const extensionName = "SillyTavern-Lucid";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};

eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, (data) => {
  let messages = data.finalMesSend;
  let narratorRE = /<\|start_header_id\|>writer character (.*narrator[^<]*)<\|end_header_id\|>/;
  let assistantRE = /<\|start_header_id\|>writer character (.*assistant[^<]*)<\|end_header_id\|>/;
  let oocRE = /<\|start_header_id\|>writer character ([^<]+)<\|end_header_id\|>[\n\r]*\(\(Out-of-Character\)\)/;

  for (let index = 0; index < messages.length; index++) {
    let currentMessage = messages[index];

    let match = currentMessage.message.match(narratorRE);
    while (match) {
      console.log("FROM: ", currentMessage.message)
      currentMessage.message = currentMessage.message.replace(narratorRE, "<|start_header_id|>writer narration<|end_header_id|>")
      console.log("TO: ", currentMessage.message)

      match = currentMessage.message.match(narratorRE);
    }

    match = currentMessage.message.match(assistantRE);
    while (match) {
      console.log("FROM: ", currentMessage.message)
      currentMessage.message = currentMessage.message.replace(assistantRE, "<|start_header_id|>assistant<|end_header_id|>")
      console.log("TO: ", currentMessage.message)

      match = currentMessage.message.match(assistantRE);
    }

    match = currentMessage.message.match(oocRE);
    while (match) {
      console.log("FROM: ", currentMessage.message)
      currentMessage.message = currentMessage.message.replace(oocRE, "<|start_header_id|>user<|end_header_id|>")
      console.log("TO: ", currentMessage.message)

      match = currentMessage.message.match(oocRE);
    }
  }
});

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  //Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }

  // Updating settings in the UI
  $("#example_setting").prop("checked", extension_settings[extensionName].example_setting).trigger("input");
}

// This function is called when the extension settings are changed in the UI
function onEnabledChanged(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].example_setting = value;
  saveSettingsDebounced();
}

// This function is called when the button is clicked
function onTestButtonClicked() {
  let context = getContext();
  // Let's make a popup appear with the checked setting
  toastr.info(
    `The checkbox is ${extension_settings[extensionName].example_setting ? "checked" : "not checked"}`,
    "A popup appeared because you clicked the button!"
  );
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
  $("#test_button").on("click", onTestButtonClicked);
  $("#enabled_setting").on("input", onEnabledChanged);

  // Load settings when starting things up (if you have any)
  loadSettings();
});


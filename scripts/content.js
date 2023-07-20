const LMNT_SYNTHESIZE_URL = 'https://api.lmnt.com/speech/beta/synthesize';
const LMNT_ORACLE_URL = 'https://api.lmnt.com/anya/beta/oracle';

const CUSTOM_VOICES = {
};

const LMNT_AUDIO_CSS_CLASS = 'lmnt-audio';
const TICK_DELAY = 1000;
const LONG_TICK_DELAY = 5000;

let lmntApiKey = '';
chrome.storage.sync.get(["lmnt_api_key"]).then((result) => {
  setLmntApiKey(result.lmnt_api_key);
  if (!lmntApiKey) {
    // console.log('No LMNT api key, opening options page.');
    chrome.runtime.sendMessage("showOptions");
  }
  setTimeout(tick, TICK_DELAY);
});

function setLmntApiKey(key) {
  lmntApiKey = key || '';
};

// Watch for changes to the user's options and apply them.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.lmnt_api_key) {
    const newKey = changes.lmnt_api_key.newValue;
    setLmntApiKey(newKey);
  }
});

let selectedVoice;
let lastCharacterName;
let latestMessageRow;

async function tick() {
  if (!lmntApiKey) {
    setTimeout(tick, LONG_TICK_DELAY);
    return;
  }

  [selectedVoice, lastCharacterName] = await computeVoice(lmntApiKey, lastCharacterName, selectedVoice);
  if (selectedVoice) {
    latestMessageRow = processLatestMessage(lmntApiKey, selectedVoice, lastCharacterName, latestMessageRow);
  }

  setTimeout(tick, TICK_DELAY);
};

async function computeVoice(lmntApiKey, lastCharacterName, lastSelectedVoice) {
  let characterName;
  let selectedVoice;

  // console.log('Looking for character name.');
  // Character name is within a div with a class name like `BotHeader_boldTitle__mzvkG`.
  const headerEl = findDivsWithClassPrefix('BotHeader_boldTitle')[0];
  if (!headerEl) {
    return [lastSelectedVoice, lastCharacterName];
  }

  characterName = headerEl ? headerEl.innerText?.trim() : '';
  // console.log(`Found character info [name=${characterName}].`);
  // debugger;

  if (characterName && characterName != lastCharacterName) {
    selectedVoice = CUSTOM_VOICES[characterName.toLowerCase()];
    if (selectedVoice) {
      console.log(`Selected custom voice [name=${characterName}, voice=${selectedVoice}].`)
    } else {
      const response = await ohOracleOfTheLakeWhatIsYourWisdom(lmntApiKey, characterName)
      selectedVoice = response["voice_id"]

      console.log(`Oracle selected voice [name=${characterName}, voice=${selectedVoice}].`)
    }
  } else {
    selectedVoice = lastSelectedVoice;
  }

  return [selectedVoice, characterName];
};

function processLatestMessage(apiKey, selectedVoice, characterName, previousRow) {
  const currentMessageRow = getLatestChatTextElement();
  // cmrtext = currentMessageRow ? currentMessageRow.innerText : '';
  // pmrtext = previousRow ? previousRow.innerText : '';
  // console.log(`processLatestMessage [name=${characterName}, cmrtext=${cmrtext}, pmrtext=${pmrtext}].`);
  if (!currentMessageRow || currentMessageRow == previousRow) {
    return currentMessageRow;
  }

  if (isHumanRow(currentMessageRow)) {
    // console.log(`Skipping human row [row=${currentMessageRow}].`);
    return previousRow;
  }

  if (!isDataComplete(currentMessageRow)) {
    // console.log(`Skipping not-data-complete row [row=${currentMessageRow}].`);
    return previousRow;
  }

  // Message_row___ur0Y Message_humanRow__cmibI
  // Message_botMessageBubble__CPGMI 

  let latestText = getLatestChatText(currentMessageRow, characterName);
  console.log(`Processing new message row [latestText=${latestText}, name=${characterName}, voice.id=${selectedVoice.id}].`);
  // debugger;
  if (!latestText) {
    return previousRow;
  }
  console.log(`Speak: '${latestText}'.`);
  latestText = latestText.replace(/•/g, '');

  synthesizeText(apiKey, selectedVoice, latestText)
    .then(response => response.blob())
    .then(blob => {
      const audioBlobUrl = URL.createObjectURL(blob)
      const audioElement = new Audio(audioBlobUrl);
      audioElement.classList.add(LMNT_AUDIO_CSS_CLASS);
      audioElement.controls = true;
      audioElement.style = 'margin-left: 40px;';
      audioElement.autoplay = true;
      getLatestChatTextElement().parentElement.appendChild(audioElement);
    });
  return currentMessageRow;
};

function isHumanRow(messageRowEl) {
  const humanRowEl = findDivsWithClassPrefix('Message_humanRow', messageRowEl);
  return humanRowEl && humanRowEl.length > 0;
};

function isDataComplete(messageRowEl) {
  const attrValue = messageRowEl.getAttribute('data-complete');
  return (attrValue === 'true');
};

function getLatestChatTextElement() {
  // Each chat message is a pair within a containing div of class `ChatMessagesView_messagePair__CsQMW`.
  // The suffix of the class name is a hash that changes with each page load, so we can't rely on it.
  // Individual messages have a class name as `ChatMessage_messageRow__7yIr2`.
  const messageRowEl = findDivsWithClassPrefix('ChatMessage_messageRow');
  return (messageRowEl.length == 0) ? null : messageRowEl[messageRowEl.length - 1];
};

function findDivsWithClassPrefix(prefix, opt_rootElement) {
  const startElement = opt_rootElement || document;
  const allDivs = startElement.querySelectorAll('div');
  const matchedDivs = [];

  allDivs.forEach(div => {
      const classes = div.className.split(/\s+/); // split class string into separate classes
      classes.forEach(cls => {
          if (cls.startsWith(prefix)) { // if the class starts with the prefix
              matchedDivs.push(div);
          }
      });
  });

  return matchedDivs;
}

function getLatestChatText(messageRowElement, targetSpeakerName) {
  return messageRowElement ? messageRowElement.innerText : '';
};

async function ohOracleOfTheLakeWhatIsYourWisdom(apiKey, character) {
  const formData = new FormData();
  formData.append('name', character);
  return fetch(LMNT_ORACLE_URL, {
    headers: {
      'X-API-Key': apiKey
    },
    method: 'POST',
    body: formData
  }).then(response => response.json());
};

async function synthesizeText(apiKey, voice, text) {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('voice', voice);

  return fetch(LMNT_SYNTHESIZE_URL, {
    headers: {
      'X-API-Key': apiKey
    },
    method: 'POST',
    body: formData
  });
};

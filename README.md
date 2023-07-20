# Astrid

An experimental Chrome extension aiming to let users talk with AI characters at [Poe](https://www.poe.com).

Please note that this extension is developed solely for
entertainment purposes and is not affiliated with
[Poe](https://www.poe.com).

## Installation

The extension is available for installation on the [Chrome Web Store](https://chrome.google.com/webstore/detail/lmnt-poe-speech/bpjnglplfbjmffahdejhmekhbmlcopmo). You can also install it in the Chrome web browser as a Developer-mode "unpacked extension", steps as:

- check out this repository
- visit [chrome://extensions](chrome://extensions)
- turn on 'Developer Mode' in the top right
- use the 'Load unpacked' button in the top left to select the `astrid` directory

The extension will open an options screen after installation with instructions
on how to obtain an LMNT API key (free!).

After entering an LMNT API key in the extension options page, visit
https://www.poe.com. When talking with a character a voice will be
selected based on a conjecture of suitability. After a character's most recent
text reply is received, LMNT will synthesize speech for the character on the
fly, an audio widget will appear beneath the text, and it will auto-play if
permitted.

## Release History

1.1 / Jul 20, 2023 / Update license and minor cleanup.
1.0 / Jul 19, 2023 / Initial release.

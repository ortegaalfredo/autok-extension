# autok-extension README

Automated AI bug-hunter. 
This is a vscode extension implementing the algorithm at https://github.com/ortegaalfredo/autokaker.


```
  _____
 /     \ 
|  o o  |
| \___/ |
|_______|     
```

![autok-extension demo](https://raw.githubusercontent.com/ortegaalfredo/autok-extension/main/autok-demo.gif)


## Install

This extension can be installed from vscode using the "Install from VSIX..." menu from the extensions settings. Just locate the pre-compiled vsix file and open it. 

## Usage

After installation, place the cursor inside any c/c++/solidity or even javascript function and press "F12", the plugin will analyze the code and report results.
By pressing "Ctrl+F12" the extension will sequentailly analizy all functions in the current open file.

## Features

Autok-extension is an automatic vulnerabilit scanner.
It supports many languages as the AI auto-recognizes the language and framework.
Supports local LLMs using OpenAI-style endpoints and api key.

## Requirements
It was tested on vscode 1.92.
By default, it uses the free service from Neuroengine.ai, that require no configuration.

## Extension Settings


## Known Issues
As many vuln scanners, the AI might report false-positives, specially the free version.
The free version is rate-limited. For good results, a SOTA LLM is recommended, like gpt-4o or Claude-Opus.

## build

To build the vsix file, make sure you have node.js installed, then run:
```
npm install -g @vscode/vsce
```

Then, execute this command in the root directory to compile the extension into a .vsix file:

```
vsce package
```

## Release Notes

### 1.0.0

Initial release of autok-extension

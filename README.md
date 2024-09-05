# autok-extension README
Autok-Extension is an automated AI bug-hunter for Visual Studio Code.
```
      _____
     /     \ 
    |  o o  |
    | \___/ |
    |_______|
 Autok-extension 
(AI self-portrait)
```

## Overview
Autok-Extension is a Visual Studio Code extension that implements the algorithm from [Autokaker](https://github.com/ortegaalfredo/autokaker). This extension helps developers by automatically identifying and reporting bugs in their code, leveraging advanced AI techniques.


Demo running on gpt-4o:
![autok-extension demo](https://raw.githubusercontent.com/ortegaalfredo/autok-extension/main/autok-demo.gif)

## Install

First, download the .vsix extension from:

[Autok-extension VSIX](https://github.com/ortegaalfredo/autok-extension/raw/main/autokaker-0.0.1.vsix)

This extension can be installed in VSCode using the "Install from VSIX..." menu from the extensions settings. Simply locate the pre-compiled .vsix file and open it.

## Usage

After installation, place the cursor inside any C/C++, Solidity, or JavaScript function and press F12. The plugin will analyze the code and report the results. For a more detailed report, press Alt+F12.

Also by pressing the combination Ctrl+F12, the extension will sequentially analyze all functions in the currently open file.

If a vulnerability is found, it is added as a label as such. The label is color-coded with black meaning no impact and bright red, critical impact. Pressing F12 again will clean all labels.

## Features

- Automatic vulnerabilit scanner.
- It supports many languages as the AI auto-recognizes the language and framework.
- Supports local LLMs using OpenAI-style endpoints and api keys.

## Requirements
This extension was tested on VSCode 1.92. By default, it uses the free LLM service from [Neuroengine.ai](https://www.neuroengine.ai), which requires no additional configuration.

## Extension Settings

From the extension settings page, you can set the LLM type (neuroengine, OpenAI or custom endpoint)
The default do not require any furter configuration. If you choose OpenAI or custom-endpoint, you need to fill the required parameters, like API-key and model name.

![Settings page](https://raw.githubusercontent.com/ortegaalfredo/autok-extension/main/setting.png)

## Known Issues

Like many vulnerability scanners, the AI might report false positives, especially the free version. The free version is also rate-limited. For optimal results, a state-of-the-art LLM is recommended, such as GPT-4 or Claude-Opus.

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

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

[Autok-extension VSIX](https://github.com/ortegaalfredo/autok-extension/raw/main/autokaker-0.0.5.vsix)

This extension can be installed in VSCode using the "Install from VSIX..." menu from the extensions settings. Simply locate the pre-compiled .vsix file and open it.

## Usage

After installation, place the cursor inside any C/C++, Solidity, or JavaScript function and press F12. The plugin will analyze the code and report the results. 

Also by pressing the combination Ctrl+F12, the extension will sequentially analyze all functions in the currently open file.

If a vulnerability is found, it is added as a label as such. The label is color-coded with black meaning no impact and bright red, critical impact. Pressing F12 again will clean all labels.

## Features

- Automatic vulnerabilit scanner.
- It supports many languages as the AI auto-recognizes the language and framework.
- Supports local LLMs using OpenAI-style endpoints and api keys.

## Requirements
This extension was tested on VSCode 1.92. By default, it uses the free LLM service from [Neuroengine.ai](https://www.neuroengine.ai), which requires no additional configuration.

## Extension Settings

### Multishot

Make several queries to the LLM to improve results. Slow but usually improves quality.

### Report

Write a detailed description of every finding to an external file. The filename is the current file plus ".report" extension.

### Verify

Verify each finding to reduce false positive rate. It attach "UNLIKELY" to each unlikely finding, and the color is yellow instead of red. This option increment greatly the finding quality but is *very* slow and is recommended to use with a fast LLM.

### Service

Choose 'Neuroengine.ai' for free analyzer API. Choose 'OpenAI' to use ChatGPT and other models, remember to set model and apikey. Choose 'Custom endpoint' and specify it in the next setting.

### Custom endpoint

URL of the custom endpoint. For example, to access a local llama.cpp server API enter 'http://127.0.0.1:8080/v1/chat/completions'.

### Model name

Model name for OpenAI-style services. A good model is 'gpt-4o'. The free Neuroengine API does not use this setting.

### Api Key

Service API Key. The free Neuroengine API does not use this setting.


![Settings page](https://raw.githubusercontent.com/ortegaalfredo/autok-extension/main/setting.png)


## Setting up local AI

1. **Download your AI model**, for example: [Meta-Llama-3.1-8B-Instruct-GGUF](https://huggingface.co/lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF/tree/main)

2. **Download and install `llama.cpp`** from [GitHub Releases](https://github.com/ggerganov/llama.cpp/releases)

3. **Start the server**:

    ```sh
    ./llama-server -m Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf -if -fa -c 4096 --no-mmap --host 0.0.0.0 --port 2242 -t 10 -np 5
    ```

    **Note**: Add the parameter `--gpu-layers 200` if you have a Nvidia GPU. This is very recommended.

4. **Open the extension settings** and choose **'custom endpoint'** and set the custom endpoint field to:

    ```
    http://127.0.0.1:2242/v1/chat/completions
    ```

    Replace `127.0.0.1` with your IP if you run it on another host.

Note: Llama-3.1-8B will work even without GPU but results will be of worse quality than bigger, slower models.


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
## 0.0.5

Add finding verification and report writing

### 0.0.2

Add multishot

### 0.0.1

Initial release of autok-extension


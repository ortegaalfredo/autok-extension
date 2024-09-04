import * as vscode from 'vscode';
import getLLMResponse from './llm';
import { Range, extractFunctionRanges, findRangeForLineNumber, getTextWithinRange } from './parser';

// Define an interface to represent the structure of the JSON vulnerability data
interface Vulnerability {
    line: number; // The line number where the vulnerability is detected
    shortdescription: string; // A brief description of the vulnerability
    impact: number; // The impact level of the vulnerability
}

interface VulnerabilitiesData {
    vulnerabilities: Vulnerability[]; // An array of vulnerability objects
}

// State machine to control the analysis process
enum AnalysisState {
    DontRun = 'DontRun', // State indicating not to run the analysis
    AnalyzeAll = 'AnalyzeAll', // State indicating to analyze all files
    AnalyzeCurrent = 'AnalyzeCurrent' // State indicating to analyze the current file
}

interface EditorDecorations {
    editor: vscode.TextEditor; // The text editor instance
    //decorators: vscode.TextEditorDecorationType[]; // Array of decoration types (commented out)
    data: RangeAndText[]; // Array of range and text data for decorations
}

// Array to store all open editors with their decorations
let editorsWithDecorations: EditorDecorations[] = [];

// Store information about a vulnerability
interface RangeAndText {
    range: vscode.Range;
    text: string;
    impact: number;
    decoration: vscode.TextEditorDecorationType;
}

// Store the line ranges to analyze in the source code
const rangesToAnalyze: Range[]=[];

  //-----------------------------------------------------------------------------------------

// Method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.log('Autokaker is now active.');

    // Register a command to show a message
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.showMessage', (message) => {
            vscode.window.showInformationMessage(message);
        })
    );

    // Variables to track the state of the analysis
    let LLMActive: boolean = false;
    let KakerState: AnalysisState = AnalysisState.DontRun;

    // Register a command to activate the extension
    const activateCommand = vscode.commands.registerCommand('autokaker.activate', () => {
        vscode.window.showInformationMessage('AutoK activated.');
    });

    // Register a command to analyze the current function
    let disposableF11 = vscode.commands.registerCommand('autokaker.analyzeFunction', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && !LLMActive) {
            LLMActive = true;
            KakerState = AnalysisState.AnalyzeCurrent;
            await highlightDebugLines(editor, KakerState);
            KakerState = AnalysisState.DontRun;
            LLMActive = false;
        }
    });

    // Register a command to analyze the entire file
    let disposableF12 = vscode.commands.registerCommand('autokaker.analyzeAll', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && !LLMActive) {
            LLMActive = true;
            KakerState = AnalysisState.AnalyzeAll;
            await highlightDebugLines(editor, KakerState);
            KakerState = AnalysisState.DontRun;
            LLMActive = false;
        }
    });

    // Add the commands to the context subscriptions
    context.subscriptions.push(disposableF11, disposableF12);

    // Subscribe to the event when the active text editor changes (switching tabs)
    const changeTab = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            restoreDecorations(editor);
            KakerState = AnalysisState.AnalyzeAll;
        }
    });

    // Add the activate command and changeTab event to the context subscriptions
    context.subscriptions.push(activateCommand);
    context.subscriptions.push(changeTab);
}


// Restore all decorations (vulnerabilities) when editor.document is switched (generally when tabs are switched)
function restoreDecorations(editor:vscode.TextEditor) {
    console.log('Searching editor:' + editor.document.fileName );
    editorsWithDecorations.forEach((editorDecorations, index) => {
        if (editor.document === editorDecorations.editor.document ) {
            console.log('Editor found:' + editor.document.fileName);
            editorDecorations.data.forEach(({ range, text,impact,decoration }) => {
                editor.setDecorations(decoration, [range]);
                console.log('Restoring decoration :' + text);
            });
            }
        });
}

function extractJsonFromString(input: string): string | null {
    const jsonRegex = /{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/;
    const match = input.match(jsonRegex);
    
    if (match) {
      try {
        // Attempt to parse the extracted string to ensure it's valid JSON
        JSON.parse(match[0]);
        return match[0];
      } catch (error) {
        console.error("Extracted string is not valid JSON:", error);
        return null;
      }
    }
    
    return null;
  }

  //------------------------------------- Manage Decorations ------------------------------------
  // Create custom decoration (vuln text box) 
  function createDecorationType(text: string,impact:number): vscode.TextEditorDecorationType {
    // Calculate the alpha value based on the impact
    const alpha = (impact - 1) * (0.5 / 9); // This will give a value between 0.1 and 0.5 when impact is between 1 and 10

    return vscode.window.createTextEditorDecorationType({
        after: {
            contentText: `<-- ${text}`,
            color: new vscode.ThemeColor('editor.foreground'),
            backgroundColor:  `rgba(255, 0, 0, ${alpha})`,
            border: '1px solid darkgray',
            margin: '0 0 0 3em',
            fontStyle: 'italic',
            textDecoration: 'none; font-size:0.8rem',
        },
    });
}


function getCurrentLineNumber(editor:vscode.TextEditor): number | undefined {
    if (editor) {
        const selection = editor.selection;
        const lineNumber = selection.start.line;
        return lineNumber;
    }
    return undefined;
}

function showNotification(message: string, duration: number) {
    vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification },
      async (progress) => {
        const steps = 100;
        const delay = duration / steps;
  
        for (let i = 0; i <= steps; i++) {
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              progress.report({ increment: 1, message: message });
              resolve();
            }, delay);
          });
        }
      }
    );
  }

async function highlightDebugLines(editor: vscode.TextEditor,KakerState:AnalysisState) {
    if (editor) {
        const fullCode = editor.document.getText();
        // Extract function ranges
        //const functionRanges: Range[] = extractFunctionRanges(fullCode);
        const functionRanges = extractFunctionRanges(fullCode);
        const currentLine = getCurrentLineNumber(editor);
        if (currentLine===undefined)  {return;}
        const currentRange = findRangeForLineNumber(functionRanges,currentLine);
        if (currentRange===undefined) {return;}
        // Filter functionRanges to exclude currentRange
        const filteredRanges = functionRanges.filter(range =>
            range.start !== currentRange.start || range.end !== currentRange.end
        );
        // Clear array
        rangesToAnalyze.length = 0;
        // Add current range first to the list of ranges to analyze
        rangesToAnalyze.push(currentRange);
        // Add all other ranges
        if (KakerState===AnalysisState.AnalyzeAll) {
            rangesToAnalyze.push(...filteredRanges);
            }

        const config = vscode.workspace.getConfiguration('autokaker');
        const LLMService = config.get<string>('LLMServiceName', 'Neuroengine-Code');
        let   rangesAndTexts: RangeAndText[] = [];
        // Retrieve old decorations and ranges from editor storage
        editorsWithDecorations.forEach((editorDecorations, index) => {
        if (editor.document === editorDecorations.editor.document) {
            rangesAndTexts = editorDecorations.data;
            }
        });
        //editor.setDecorations(createDecorationType('',0),[]);
        // Iterate though all ranges and analyze
        let numranges=0;
        for (const analyzedRange of rangesToAnalyze) {
            numranges++;
            const code = getTextWithinRange(fullCode,analyzedRange);
            const prompt = `<s>[INST]Analize the following code very carefully and look for security bugs, integer overflow, memory leaks and use-after-free vulnerabilities:\n\n`+code+`\n\nNow, return a list of bugs in json format like this:

{"vulnerabilities": [
{"line":3,shortdescription:"Stack-based buffer overflow", "impact":10},
{"line":15,shortdescription:"Possible integer overflow in variable X","impact":4}
]}

Make sure you verify the vulnerabilities. Write this raw json and nothing more:[/INST]`

            const jsonbegin= `
{"vulnerabilities": [
    {"line":`;

            try {
                    // Clear previous decorations if any
                    let disposedDecorations = 0;
                    if (rangesAndTexts) {

                        rangesAndTexts = rangesAndTexts.filter(({ range, text, impact, decoration }) => {
                            if (decoration) {
                                if ((range.start.line >= analyzedRange.start) && (range.start.line <= analyzedRange.end)) {
                                    decoration.dispose();
                                    disposedDecorations++;
                                    return false; // This will exclude the current item from the new array
                                } else {
                                    return true; // This will include the current item in the new array
                                }
                            } else {
                                console.error('Decoration is undefined or null for text:', text);
                                return true; // Include items with undefined or null decorations in the new array as well to avoid losing them completely due to error logging only and not handling them properly herein this filter function contextually! :)
                            }
                        });

                    };
                    // If we erased decorations, then don't call the llm. We don't re-analyze an already-analyzed function.
                    if (disposedDecorations==0) {
                        let messageString: string;
                        if (KakerState===AnalysisState.AnalyzeAll) {messageString ='AUTOK: Analyzing function '+numranges+' of '+rangesToAnalyze.length+"...";}
                        else {messageString = 'AUTOK: Analyzing current function...';}
                        //let editorMessage = vscode.window.showInformationMessage(messageString);
                        showNotification(messageString,5000);
                        // Set background color of analyzed range
                        const funcDecoration = vscode.window.createTextEditorDecorationType({
                            backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        });
                        const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
                            overviewRulerColor: 'blue',
                            overviewRulerLane: vscode.OverviewRulerLane.Right,
                            light: {
                                // this color will be used in light color themes
                                borderColor: 'darkblue'
                            },
                            dark: {
                                // this color will be used in dark color themes
                                borderColor: 'lightblue'
                            }
                        });
                        const startFunc = new vscode.Position(analyzedRange.start,0);
                        const endFunc = new vscode.Position(analyzedRange.end+1,0);
                        const functionRange = new vscode.Range(startFunc,endFunc);
                        editor.setDecorations(funcDecoration,[functionRange]);
                        //editor.setDecorations(smallNumberDecorationType,[functionRange]);

                        // Call LLM and process code
                        let response: string | null = await getLLMResponse(prompt, jsonbegin);
                        funcDecoration.dispose();
                        if (response === null) {
                            console.log('Response null');
                            return;
                            }
                        response = response.replace(prompt,'');
                        response = extractJsonFromString(response);
                        // Parse the JSON string into a JavaScript object
                        const jsonVulns: VulnerabilitiesData = JSON.parse(response!);
                        // Iterate through the array and process each vulnerability
                        jsonVulns.vulnerabilities.forEach(vulnerability => {
                            const startPos = new vscode.Position(vulnerability.line-1, 0);
                            const endPos = new vscode.Position(vulnerability.line-1, editor.document.lineAt(vulnerability.line-1).text.length);
                            const range = new vscode.Range(startPos, endPos);
                            const decorationType = createDecorationType(vulnerability.shortdescription,vulnerability.impact);
                            rangesAndTexts.push({range,text:vulnerability.shortdescription,impact:vulnerability.impact,decoration:decorationType});
                        });
                        }
                    
                    // Set decorations
                    rangesAndTexts.forEach(({ range, text,impact,decoration }) => {
                            if (editor) {
                                editor.setDecorations(decoration, [range]);
                                }   
                        });
                    // Store decorations because vscode erases them every time it changes the editor file
                    let editorFound:boolean = false;
                    editorsWithDecorations.forEach((editorDecorations, index) => {
                        if (editor.document === editorDecorations.editor.document) {
                            editorDecorations.data=rangesAndTexts;
                            editorFound=true;
                            }
                        });
                    if (!editorFound) {
                        editorsWithDecorations.push({editor:editor,data:rangesAndTexts});
                        }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.log('Error:'+error.message);
                    vscode.window.showErrorMessage('Error calling AI: ' + error.message);
                } else {
                    console.log('Error');
                    vscode.window.showErrorMessage('An unknown error occurred');
                }
            }
        }
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}

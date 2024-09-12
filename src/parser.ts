// Define an interface for a range with start and end properties
export interface Range {
    start: number;
    end: number;
}

// Function to extract function ranges from a given code string
export function extractFunctionRanges(code: string): Range[] {
    const lines = code.split('\n'); // Split the code into lines
    const ranges: Range[] = []; // Array to store the ranges
    const stack: number[] = []; // Stack to keep track of opening braces

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim(); // Trim whitespace from the line

        if (line.includes('{')) {
            stack.push(Math.max(i-5,0)); // Push the line number onto the stack if it contains an opening brace
        }

        if (line.includes('}')) {
            if (stack.length > 0) {
                const start = stack.pop(); // Pop the line number from the stack
                if (stack.length === 0) {
                    ranges.push({ start: start! + 1, end: i + 1 }); // Add the range to the ranges array
                }
            }
        }
    }

    return ranges; // Return the array of ranges
}

// Function to find the range that includes a given line number
export function findRangeForLineNumber(ranges: Range[], lineNumber: number): Range | undefined {
    for (const range of ranges) {
        if (lineNumber >= range.start && lineNumber <= range.end) {
            return range; // Return the range if the line number is within it
        }
    }
    return undefined; // Return undefined if no range is found
}

// Function to get the text within a given range
export function getTextWithinRange(text: string, range: Range): string {
    const lines = text.split('\n'); // Split the text into lines
    const resultLines: string[] = []; // Array to store the lines within the range

    for (let i = range.start; i <= range.end; i++) {
        if (i >= 0 && i < lines.length) {
            resultLines.push(`${i + 1} ${lines[i]}`); // Add the line to the result array
        }
    }

    return resultLines.join('\n'); // Return the lines within the range as a single string
}
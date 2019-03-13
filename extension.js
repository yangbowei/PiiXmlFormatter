// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
var vkbeautify;

///Following is based on https://github.com/vkiryukhin/vkBeautify
//Extracted the xml format method only.

/**
 * vkBeautify - javascript plugin to pretty-print or minify text in XML, JSON, CSS and SQL formats.
 *  
 * Version - 0.99.00.beta 
 * Copyright (c) 2012 Vadim Kiryukhin
 * vkiryukhin @ gmail.com
 * http://www.eslinstructor.net/vkbeautify/
 * 
 * MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 */
function createShiftArr(step) {

	var space = '    ';

	if (isNaN(parseInt(step))) { // argument is string
		space = step;
	} else { // argument is integer
		switch (step) {
			case 1:
				space = ' ';
				break;
			case 2:
				space = '  ';
				break;
			case 3:
				space = '   ';
				break;
			case 4:
				space = '    ';
				break;
			case 5:
				space = '     ';
				break;
			case 6:
				space = '      ';
				break;
			case 7:
				space = '       ';
				break;
			case 8:
				space = '        ';
				break;
			case 9:
				space = '         ';
				break;
			case 10:
				space = '          ';
				break;
			case 11:
				space = '           ';
				break;
			case 12:
				space = '            ';
				break;
		}
	}

	var shift = ['\n']; // array of shifts
	for (var ix = 0; ix < 100; ix++) {
		shift.push(shift[ix] + space);
	}
	return shift;
}

function VKBeautify() {
	var settings = vscode.workspace.getConfiguration();
	this.step = settings.editor.insertSpaces ? settings.editor.tabSize : '\t';
	this.shift = createShiftArr(this.step);
};

VKBeautify.prototype.xml = function (text, step) {

	var ar = text.replace(/>\s{0,}</g, "><")
		.replace(/</g, "~::~<")
		.replace(/\s*xmlns\:/g, "~::~xmlns:")
		.replace(/\s*xmlns\=/g, "~::~xmlns=")
		.split('~::~'),
		len = ar.length,
		inComment = false,
		deep = 0,
		str = '',
		ix = 0,
		shift = step ? createShiftArr(step) : this.shift;

	for (ix = 0; ix < len; ix++) {
		// start comment or <![CDATA[...]]> or <!DOCTYPE //
		if (ar[ix].search(/<!/) > -1) {
			str += shift[deep] + ar[ix];
			inComment = true;
			// end comment  or <![CDATA[...]]> //
			if (ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1 || ar[ix].search(/!DOCTYPE/) > -1) {
				inComment = false;
			}
		} else
			// end comment  or <![CDATA[...]]> //
			if (ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1) {
				str += ar[ix];
				inComment = false;
			} else
				// <elm></elm> //
				if (/^<\w/.exec(ar[ix - 1]) && /^<\/\w/.exec(ar[ix]) &&
					/^<[\w:\-\.\,]+/.exec(ar[ix - 1]) == /^<\/[\w:\-\.\,]+/.exec(ar[ix])[0].replace('/', '')) {
					str += ar[ix];
					if (!inComment) deep--;
				} else
					// <elm> //
					if (ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) == -1 && ar[ix].search(/\/>/) == -1) {
						str = !inComment ? str += shift[deep++] + ar[ix] : str += ar[ix];
					} else
						// <elm>...</elm> //
						if (ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) > -1) {
							str = !inComment ? str += shift[deep] + ar[ix] : str += ar[ix];
						} else
							// </elm> //
							if (ar[ix].search(/<\//) > -1) {
								str = !inComment ? str += shift[--deep] + ar[ix] : str += ar[ix];
							} else
								// <elm/> //
								if (ar[ix].search(/\/>/) > -1) {
									str = !inComment ? str += shift[deep] + ar[ix] : str += ar[ix];
								} else
									// <? xml ... ?> //
									if (ar[ix].search(/<\?/) > -1) {
										str += shift[deep] + ar[ix];
									} else
										// xmlns //
										if (ar[ix].search(/xmlns\:/) > -1 || ar[ix].search(/xmlns\=/) > -1) {
											str += shift[deep] + ar[ix];
										}

		else {
			str += ar[ix];
		}
	}

	return (str[0] == '\n') ? str.slice(1) : str;
}

function updateVKBeautify() {
	vkbeautify = new VKBeautify();
}

updateVKBeautify();

//Build a range of the entire document!
function getRange(document) {

	return new vscode.Range(
		// line 0, char 0:
		0, 0,
		// last line:
		document.lineCount - 1,
		// last character:
		document.lineAt(document.lineCount - 1).range.end.character
	)
}

function replaceAll(str, find, replace)
{
	return str.replace(new RegExp(find, 'g'), replace);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "piixmlformatter" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.piiformatter', function () {
		// The code you place here will be executed every time your command is executed
		console.log('in the command');

		
        // Display a message box to the user
        let editor = vscode.window.activeTextEditor;
		
        if (editor) {
			let replaceText = "REDACTED";
			let fullText = editor.document.getText();
			
			console.log(fullText);
			
			let wholeRange = getRange(editor.document);
			let newText = replaceAll(fullText, '<PII:H101.*?>', replaceText);
			
			console.log(newText);

			let formattedText = vkbeautify.xml(newText);
			editor.edit(editBuilder => {
				editBuilder.replace(wholeRange, formattedText);
			});
		}

		// Display a message box to the user
		vscode.window.showInformationMessage('Format done!');
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

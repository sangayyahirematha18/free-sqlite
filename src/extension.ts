// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { events } from './constant';
import { SqliteEditorProvider } from './databaseEditor';
import eventService from './eventService';

const uiDir = path.resolve(__dirname, '../ui_dist');
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "free-sqlite" is now active!');

	context.subscriptions.push(
		SqliteEditorProvider.register(context, uiDir, '/'),
		vscode.workspace.onDidChangeConfiguration((e) => {
			// console.log('onDidChangeConfiguration----', e, e.affectsConfiguration('workbench.colorTheme'));
			if (e.affectsConfiguration('workbench.colorTheme')) {
				eventService.emit(events.CHANGE_THEME);
			}
		})
	);
	
}

// This method is called when your extension is deactivated
export function deactivate() {}

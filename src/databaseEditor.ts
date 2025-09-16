import * as vscode from 'vscode';
import { parse } from 'path';
import { Disposable } from './dispose';

import { WebviewDialog } from './libs/webviewDialog';
import { handleMessages } from './server/api';

const md5 = require('md5');

interface SqliteDocumentDelegate {
	getDB(): any;
}

/**
 * Define the document (the data model) used for paw draw files.
 */
class SqliteDocument extends Disposable implements vscode.CustomDocument {

	static async create(
		uri: vscode.Uri,
		backupId: string | undefined,
		delegate: SqliteDocumentDelegate,
	): Promise<SqliteDocument | PromiseLike<SqliteDocument>> {
		// If we have a backup, read that. Otherwise read the resource from the workspace
		const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
		return new SqliteDocument(uri, delegate);
	}

	private readonly _uri: vscode.Uri;

	private readonly _delegate: SqliteDocumentDelegate;

	private constructor(
		uri: vscode.Uri,
		delegate: SqliteDocumentDelegate
	) {
		super();
		this._uri = uri;
		this._delegate = delegate;
	}

	public get uri() { return this._uri; }


	private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
	/**
	 * Fired when the document is disposed of.
	 */
	public readonly onDidDispose = this._onDidDispose.event;

	// private readonly _onDidChangeDocument = this._register(new vscode.EventEmitter<{
	// 	readonly content?: Uint8Array;
	// 	readonly edits: readonly PawDrawEdit[];
	// }>());
	/**
	 * Fired to notify webviews that the document has changed.
	 */
	// public readonly onDidChangeContent = this._onDidChangeDocument.event;

	private readonly _onDidChange = this._register(new vscode.EventEmitter<{
		readonly label: string,
		undo(): void,
		redo(): void,
	}>());
	/**
	 * Fired to tell VS Code that an edit has occurred in the document.
	 *
	 * This updates the document's dirty indicator.
	 */
	public readonly onDidChange = this._onDidChange.event;

	/**
	 * Called by VS Code when there are no more references to the document.
	 *
	 * This happens when all editors for it have been closed.
	 */
	dispose(): void {
		this._onDidDispose.fire();
		super.dispose();
	}

	/**
	 * Called when the user edits the document in a webview.
	 *
	 * This fires an event to notify VS Code that the document has been edited.
	 */
	makeEdit() {
	}

	/**
	 * Called by VS Code when the user saves the document.
	 */
	async save(cancellation: vscode.CancellationToken): Promise<void> {

	}

	/**
	 * Called by VS Code when the user saves the document to a new location.
	 */
	async saveAs(targetResource: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
	}

	/**
	 * Called by VS Code when the user calls `revert` on a document.
	 */
	async revert(_cancellation: vscode.CancellationToken): Promise<void> {
	}

	/**
	 * Called by VS Code to backup the edited document.
	 *
	 * These backups are used to implement hot exit.
	 */
	async backup(destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
		return {
			id: destination.toString(),
			delete: async () => {
			}
		};
	}
}

/**
 * Provider for sqlite editors.
 *
 * Used for `.db` files extension.
 *
 * This provider demonstrates:
 *
 * - How to implement a custom editor for binary files.
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Communication between VS Code and the custom editor.
 * - Using CustomDocuments to store information that is shared between multiple custom editors.
 * - Implementing save, undo, redo, and revert.
 * - Backing up a custom editor.
 */
export class SqliteEditorProvider implements vscode.CustomEditorProvider<SqliteDocument> {

	public static register(context: vscode.ExtensionContext, resourceRootDir: string, router: string): vscode.Disposable {

		return vscode.window.registerCustomEditorProvider(
			SqliteEditorProvider.viewType,
			new SqliteEditorProvider(context, resourceRootDir, router),
			{
				// For this demo extension, we enable `retainContextWhenHidden` which keeps the
				// webview alive even when it is not visible. You should avoid using this setting
				// unless is absolutely required as it does have memory overhead.
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false,
			}
		);
	}

	private static readonly viewType = 'free-sqlite.view';

	/**
	 * Tracks all known webviews
	 */
	private readonly webviews = new WebviewCollection();

	constructor(
		private readonly _context: vscode.ExtensionContext,
		private readonly resourceRootDir: string,
		private readonly router: string
	) { }

	//#region CustomEditorProvider

	async openCustomDocument(
		uri: vscode.Uri,
		openContext: { backupId?: string },
		_token: vscode.CancellationToken
	): Promise<SqliteDocument> {
		const document: SqliteDocument = await SqliteDocument.create(uri, openContext.backupId, {
			getDB: async () => {

			}
		});

		console.log('uri', uri);

		document.onDidDispose(() => {});

		return document;
	}

	async resolveCustomEditor(
		document: SqliteDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Add the webview to our internal set of active webviews

		console.log('resolveCustomEditor', webviewPanel);
		const pathInfo = parse(document.uri.path);
		let title = pathInfo.name;
		const pathHash = md5(document.uri.path);

		const tempPanel = new WebviewDialog(
			SqliteEditorProvider.viewType,
			this.resourceRootDir,
			document.uri.path,
			webviewPanel,
			title,
			'database',
			handleMessages
		);

		this.webviews.add(pathHash, document.uri, tempPanel.getPanel());

	}

	private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<SqliteDocument>>();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

	public saveCustomDocument(document: SqliteDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.save(cancellation);
	}

	public saveCustomDocumentAs(document: SqliteDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.saveAs(destination, cancellation);
	}

	public revertCustomDocument(document: SqliteDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.revert(cancellation);
	}

	public backupCustomDocument(document: SqliteDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
		return document.backup(context.destination, cancellation);
	}

	//#endregion

	private _requestId = 1;
	private readonly _callbacks = new Map<number, (response: any) => void>();

}

/**
 * Tracks all webviews.
 */
class WebviewCollection {

	private readonly _webviews = new Set<{
		readonly pathHash: string;
		readonly resource: string;
		readonly webviewPanel: vscode.WebviewPanel;
	}>();

	/**
	 * Get all known webviews for a given uri.
	 */
	public *get(pathHash: string): Iterable<vscode.WebviewPanel> {
		for (const entry of this._webviews) {
			if (entry.pathHash === pathHash) {
				yield entry.webviewPanel;
			}
		}
	}

	/**
	 * Add a new webview to the collection.
	 */
	public add(pathHash: string, uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
		const entry = { pathHash, resource: uri.toString(), webviewPanel };
		this._webviews.add(entry);

		webviewPanel.onDidDispose(() => {
			console.log('webviewPanel.onDidDispose', uri.toString());
			this._webviews.delete(entry);
		});
	}
}
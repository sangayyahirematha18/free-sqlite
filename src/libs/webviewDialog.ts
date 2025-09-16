/*
 * @Author: Jianbing.fang
 * @Date: 2022-02-17 14:56:20
 * @LastEditTime: 2022-05-29 22:59:01
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import eventService from '../eventService';
import { events } from '../constant';
import { fixResourceReferences, fixCspSourceReferences, notificationData, getTheme } from './utils';

const md5 = require('md5');

/**
 * 支持传入一个html文件的路径渲染出webview
 */
export class WebviewDialog {
	public readonly panel: vscode.WebviewPanel;
	// public webview(): vscode.Webview { return this.panel.webview; }
	opts: any;
	hashKey: string;
	constructor(
		viewType: string,
		resourceRootDir: string,
		dbPath: string,
		webViewPanel?: vscode.WebviewPanel,
		iTitle?: string,
		icon?: string,
		onMessageHandle?: any,
		viewColumn?: vscode.ViewColumn,
		opts?: any,
	) {
		this.opts = opts;
		this.hashKey = md5(dbPath);
		viewColumn = viewColumn || vscode.ViewColumn.One;// vscode.ViewColumn.One
		const options: vscode.WebviewOptions | vscode.WebviewPanelOptions = {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [
				vscode.Uri.file(resourceRootDir),
			]
		};

		const dialogHtmlFile = path.join(resourceRootDir, 'index.html');
		let html = fs.readFileSync(dialogHtmlFile, { encoding: 'utf8' });
		const title = iTitle || this.extractHtmlTitle(html, 'Dialog');
		if (webViewPanel) {
			this.panel = webViewPanel;
			this.panel.webview.options = {
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.file(resourceRootDir),
				]
			};
			this.panel.title = title;
			this.panel.reveal(viewColumn);
			// this.panel = viewType;
		} else {
			this.panel = vscode.window.createWebviewPanel(
				viewType,
				title,
				viewColumn,
				options);
		}

		html = fixResourceReferences(html, resourceRootDir, this.panel.webview);
		html = fixCspSourceReferences(html, this.panel.webview);

		this.panel.webview.html = html;
		this.panel.iconPath = {
			light: vscode.Uri.joinPath(vscode.Uri.file(path.resolve(__dirname, '../assets')), 'light', `${icon}.svg`),
			dark: vscode.Uri.joinPath(vscode.Uri.file(path.resolve(__dirname, '../assets')), 'dark', `${icon}.svg`)
		};

		// https://code.visualstudio.com/api/extension-guides/webview#scripts-and-message-passing
		this.panel.webview.onDidReceiveMessage((message: API.IMessage) => {
			if (onMessageHandle) {
				console.log('hashKey:', this.hashKey);
				message.hashkey = this.hashKey;
				message.dbPath = dbPath;
				onMessageHandle(message, this.panel.webview);
			}
		});

		this.commonEventsHandle();
	}

	private commonEventsHandle(){
		eventService.on(events.CHANGE_THEME, ()=>{
			this.panel.webview.postMessage(notificationData(events.CHANGE_THEME, { theme: getTheme() }));
		});
	}

	/**
	 *  解析 <title> 标签.
	 */
	private extractHtmlTitle(html: string, defaultTitle: string): string {
		const titleMatch = /\<title\>([^<]*)\<\/title\>/.exec(html);
		const title = (titleMatch && titleMatch[1]) || defaultTitle;
		return title;
	}

	public getPanel(): vscode.WebviewPanel {
		return this.panel;
	}
	public getWebView(): vscode.Webview {
		return this.panel.webview;
	}
	public reveal() {
		return this.panel.reveal();
	}
	public postMessage(message: any) {
		this.panel.webview.postMessage(message);
	}
	public setTitle(title: string) {
		this.panel.title = title;
	}
	public dispose() {
		this.panel.dispose();
	}
}

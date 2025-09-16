import { window } from 'vscode';
const packageInfo = require('../../package.json');
const logOutput = window.createOutputChannel(packageInfo.name, { log: true });
export default logOutput;

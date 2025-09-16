import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { get, set } from 'lodash';
import { v1 } from 'uuid';
import { methods } from '../constant';
import dbServer from './dbServer';
import { responseData, notificationData, getTheme, formartUri, openFile } from '../libs/utils';
import { errorCode } from "../errorCode";


const getAllTables = async (message: API.IMessage, webView: vscode.Webview) => {
    const dbHash = message.hashkey;
    const resultSet: any = await dbServer.runQuery(dbHash!, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", {}, message.dbPath);
    const result: any = [];
    if (resultSet.errorCode === 200) {
        const tables = resultSet.data;
        for (let i = 0; i < tables.length; i++) {
            let table: any = tables[i];
            const tableName = table.name;
            const columns: any = await dbServer.runQuery(dbHash!, `PRAGMA table_info(${tableName})`, {});
            result.push({
                tableName: tableName,
                columns: columns.data
            });
        }
    }
    const response: API.ResponseResult = responseData(message.id, { data: result }, true);
    webView.postMessage(response);
};

const executeSql = async (message: API.IMessage, webView: vscode.Webview) => {
    const dbHash = message.hashkey;
    const resultSet: any = await dbServer.runQuery(dbHash!, message.data.sql, {}, message.dbPath);
    webView.postMessage(responseData(message.id, resultSet, true));
};

const getUserFavorites = async (message: API.IMessage, webView: vscode.Webview) => {
    const favorites: any = await dbServer.sysQuery('SELECT * FROM t_sys_user_favorites ORDER BY priority DESC, updateAt DESC', {});
    webView.postMessage(responseData(message.id, {
        errorCode: 200,
        data: favorites
    }, true)
    );
};

const addUserFavorite = async (message: API.IMessage, webView: vscode.Webview) => {
    const { name, sql } = message.data;
    let result;
    if (!name || name.trim() === '' || !sql || sql.trim() === '') {
        result = { success: false, code: errorCode['required_parameter_missing'] }; 
    }
    const fid = v1();
    await dbServer.sysQuery(
        `INSERT INTO t_sys_user_favorites (fid, name, sqlStr, createAt, updateAt, priority) 
            VALUES ($fid, $name, $sqlStr, $createAt, $updateAt, $priority)`,
        { $fid: fid, $name: name, $sqlStr: sql, $createAt: new Date().getTime(), $updateAt: new Date().getTime(), $priority: 0 },
    );
    result = { success: true, data: fid };
    webView.postMessage(responseData(message.id, result, true));
};

/**
 * 删除一条用户收藏
 * @param fid 
 * @returns 
 */
const removeUserFavorite = async (message: API.IMessage, webView: vscode.Webview) => {
    const { id } = message.data;
    let result;
    if (!id || id.trim() === '') {
        result = { success: false, code: errorCode['required_parameter_missing'] }; 
    } else {
        await dbServer.sysQuery(
            `DELETE FROM t_sys_user_favorites WHERE fid = $fid`,
            { $fid: id }
        );
        result = { success: true }; 
    }
    webView.postMessage(responseData(message.id, result, true));
};

/**
 * 重命名一条用户收藏
 * @param fid 
 * @param name 
 * @returns 
 */
const renameUserFavorite = async(message: API.IMessage, webView: vscode.Webview) => {
    const { id, name } = message.data;
    let result;
    if (!id || id.trim() === '' || !name || name.trim() === '') {
        result = { success: false, code: errorCode['required_parameter_missing'] }; 
    }
    await dbServer.sysQuery(
        `UPDATE t_sys_user_favorites SET name = $name, updateAt = $updateAt WHERE fid = $fid`,
        { $fid: id, $name: name, $updateAt: new Date().getTime() }
    );
    result = { success: true };
    webView.postMessage(responseData(message.id, result, true));
};

/**
 * 排序用户收藏
 * @param fidList 
 * @returns 
 */
const sortUserFavorites = async(message: API.IMessage, webView: vscode.Webview) => {
    const { fidList } = message.data;
    let result: API.ResponseResult;
    if (!fidList || fidList.length === 0) {
        result = responseData(message.id, { success: false, code: errorCode['required_parameter_missing'] }, false);
    }
    for (let i = 0; i < fidList.length; i++) {
        const fid = fidList[i];
        await dbServer.sysQuery(
            `UPDATE t_sys_user_favorites SET priority = $priority WHERE fid = $fid`,
            { $fid: fid, $priority: fidList.length - i }
        );
    }
    result = responseData(message.id, { success: true }, true) ;
    webView.postMessage(result);
};

const saveToExcel = async (message: any, webView: vscode.Webview) => {
    if (message.data) {
        const {fileType, fileStr} = message.data;
        const dialogOption = {};
        if (fileType === 'excel') {
            Object.assign(dialogOption, {
                filters: {
                    'excel': ['xlsx']
                }
            });
        } else if (fileType === 'csv') {
            Object.assign(dialogOption, {
                filters: {
                    'csv': ['csv']
                }
            });
        } else {
            vscode.window.showErrorMessage('Unsupported file types');
            return;
        }
        const fileUri = await vscode.window.showSaveDialog(dialogOption);
        const savePath = get(fileUri, 'path');
        if (savePath) {
            let fpath = formartUri(savePath);
            if (fileType === 'csv') {
                await fs.writeFile(fpath, fileStr, 'utf8');
            } else if (fileType === 'excel') {
                const fileBuffer = Buffer.from(fileStr, 'base64');
                await fs.writeFile(fpath, fileBuffer);
            }
            vscode.window.showInformationMessage('File saved successfully', 'View').then((action) => {
                if (action === 'View') {
                    openFile(fpath);
                }
            });
        }
    }
    webView.postMessage(responseData(message.id || '', {}, true));
};

const copyToClipboard = async (message: any, webView: vscode.Webview)=>{
    const { content } = message.data;
    let result: API.ResponseResult;
    try {
        await vscode.env.clipboard.writeText(content);
        result = responseData(message.id, { errorCode: 200, data: 'success' }, true);
    } catch (error) {
        result = responseData(message.id, { errorCode: 500, message: 'Copy failed, please try again later' }, false);
    }
    webView.postMessage(result);
};

class ApiMap {
    private static instance: ApiMap;
    private api: Map<string, any> = new Map();
    private constructor() {
        this.init();
    }
    public static getInstance(): ApiMap {
        if (!ApiMap.instance) {
            ApiMap.instance = new ApiMap();
        }
        return ApiMap.instance;
    }
    private add(method: string, fun: Function) {
        set(this.api, method, fun);
    }
    private init() {
        this.add(methods.GET_ALL_TABLES, getAllTables);
        this.add(methods.EXECUTE_SQL, executeSql);
        this.add(methods.GET_USER_FAVORITES, getUserFavorites);
        this.add(methods.ADD_USER_FAVORITE, addUserFavorite);
        this.add(methods.REMOVE_USER_FAVORITE, removeUserFavorite);
        this.add(methods.RENAME_USER_FAVORITE, renameUserFavorite);
        this.add(methods.SORT_USER_FAVORITES, sortUserFavorites);
        this.add(methods.EXPORT_SQL_RESULT, saveToExcel);
        this.add(methods.COPY_TO_CLIPBOARD, copyToClipboard);
    }
    public get(method?: string): Function {
        const errFun = () => {
            console.log('Function not fond');
        };
        if (!method) {
            return errFun;
        }
        return get(this.api, method, errFun);
    }
}

export const handleMessages = (message: API.IMessage, webView: vscode.Webview) => {
    console.log('message:', message);
    if (message.request) {
        ApiMap.getInstance().get(message.method)(message, webView);
    } else if (message.notification) {
        // 收到通知
        if (message.method === methods.PAGE_STATUS) {
            // 页面状态的通知
            if (message.data === 'ready') {
                webView.postMessage(notificationData(methods.ROUTER, { router: '/', theme: getTheme() }));
            }
        }
    }
};

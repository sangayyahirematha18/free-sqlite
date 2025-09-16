import { Webview, Uri, workspace } from "vscode";
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { platform } from 'node:process';
import { set, keys } from "lodash";

const { exec } = require('child_process');

const userHome = process.env.HOME||process.env.USERPROFILE||'';

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function fixDynamicsSrc(html: string, assetManifest: any){
    for(let scripName in assetManifest) {
        if(scripName.endsWith('.js')) {
            html = html.replace(scripName, assetManifest[scripName]);
        }
    }
    return html;
}

/**
   * 替换 href="./file" or src="./file" 并且找到静态资源
   */
export function fixResourceReferences(html: string, resourceRootDir: string, webview: Webview): string {
    // const refRegex = /((href)|(src))="(\.\/[^"]+)"/g;
    const refRegex = /((href)|(src))="([^"]+)"/g;
    let refMatch;
    while ((refMatch = refRegex.exec(html)) !== null) {
        const offset = refMatch.index;
        const length = refMatch[0].length;
        const refAttr = refMatch[1];
        const refName = refMatch[4];
        const refPath = path.join(resourceRootDir, refName);
        const refUri = webview.asWebviewUri(Uri.file(refPath));
        const refReplace = refAttr + "=\"" + refUri + "\"";
        html = html.slice(0, offset) + refReplace + html.slice(offset + length);
    }
    return html;
}

/**
 * 替换 ${webview.cspSource} .
 */
export function fixCspSourceReferences(html: string, webview: Webview): string {
    const cspSourceRegex = /\${webview.cspSource}/g;
    let cspSourceMatch;
    while ((cspSourceMatch = cspSourceRegex.exec(html)) !== null) {
        html = html.slice(0, cspSourceMatch.index) + webview.cspSource +
            html.slice(cspSourceMatch.index + cspSourceMatch[0].length);
    }

    return html;
}

export function responseData(id?: string, data?: any, ok?: boolean): API.ResponseResult {
    return {
        response: true,
        id,
        data,
        ok
    };
}

export function notificationData(method: string, data: any){
    return {
        notification: true,
        method,
        data
    };
}

// export function csvJSON(csv: string){

//     var lines=csv.split("\n");
  
//     var result = [];
  
//     var headers=lines[0].split(",");
  
//     for(var i=1;i<lines.length;i++){
  
//         var obj = {};
//         var currentline=lines[i].split(",");
  
//         for(var j=0;j<headers.length;j++){
//             obj[headers[j] as keyof typeof obj] = currentline[j];
//         }
  
//         result.push(obj);
  
//     }
    
//     //return result; //JavaScript object
//     return JSON.stringify(result); //JSON
//   }


function isWindows() {
  console.log(`This platform is ${platform}`);
  return 'win32' === platform;
}

/**
 * 格式化路径
 * @param uri 
 */
export function formartUri(uri: string){
    if(isWindows()) {
        if(uri.startsWith('/')){
            return uri.substring(1);
        }
    }
    return uri;
}


/**
 * json转换成扁平化的数据结构
 * 迭代2层
 * @param {*} jsonData 
 */
export const jsonToFormData = (jsonData: any, separator='.')=>{
    const fkeys = keys(jsonData);
    let resut: any = {};
    for(let i = 0; i<fkeys.length; i++) {
      const temp = jsonData[fkeys[i]];
      const iType = typeof temp;
      if(!temp || iType ==='string' || iType === 'number' || Array.isArray(temp) || iType === 'boolean') {
        // 这几类可以不用继续迭代
        resut = set(resut, fkeys[i], temp);
      } else if(iType === 'object') {
        // 再迭代一层
        const subkeys = keys(temp);
        for(let p = 0; p<subkeys.length; p++) {
          resut[`${fkeys[i]}${separator}${subkeys[p]}`] = temp[subkeys[p]];
        }
      }
    }
    return resut;
};

export const getExt = (filePath: string) => {
    const index= filePath.lastIndexOf(".");
    //获取后缀
    return filePath.substring(index+1);
};

export const isAssetTypeAnImage = (ext: string) => {
    return [
    'png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].
    indexOf(ext.toLowerCase()) !== -1;
};

export const isImg = (filePath: string) => {
    const ext = getExt(filePath);
    return isAssetTypeAnImage(ext);
};

export const getTheme = () => {
    const workbench = workspace.getConfiguration('workbench') || {};
    return (workbench.colorTheme || '').toLowerCase().includes('light')
        ? 'light' : 'dark';
};

const getSysDir = ()=>{
    return path.join(userHome, 'freeSqlite');
};

export const createSysDir = async ()=>{
    const sysDir = getSysDir();
    const appExists = await existsSync(sysDir);
    if (!appExists) {
        await mkdir(sysDir);
    }
};

export function sysDbDir(): string{
    return path.join(getSysDir(), 'freeSqlite.db');
};

export function openFile(path: string) {
    let command;

    if (process.platform === 'win32') {
        command = `start "" "${path}"`; // Windows
    } else if (process.platform === 'darwin') {
        command = `open "${path}"`; // macOS
    } else if (process.platform === 'linux') {
        command = `xdg-open "${path}"`; // Linux
    } else {
        console.log('Unsupported platform');
        return;
    }

    exec(command, (error: any, stdout: any, stderr: any) => {
        if (error) {
            console.error(`Error opening folder: ${error}`);
            return;
        }
        console.log(`Folder opened successfully: ${stdout}`);
    });
}

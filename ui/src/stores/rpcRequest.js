
import { v1 } from 'uuid';
// import { testApi } from '../test/messageTest';

window.ddpMessage = {};
let vscode;
if (window.acquireVsCodeApi) {
    vscode = window.acquireVsCodeApi();
} else {
    // eslint-disable-next-line no-undef
    // vscode = devMode? testApi: acquireVsCodeApi();
}

export const postMessage = (data) => {
    if (vscode) {
        vscode.postMessage(data);
        return true;
    }
    // 非vscode环境
    return false;
}

export const formatRequest = (method, data, id) => {
    return {
        id: id || v1(),
        request: true,
        method,
        data,
        hashkey: window['hashkey']
    }
}

export const formatNotification = (method, data) => {
    return {
        notification: true,
        method,
        data,
        hashkey: window['hashkey']
    }
}

export const request = async ({ id, method, data }) => {
    const requestData = formatRequest(method, data, id);
    return new Promise((resolve, rejects) => {
        if (postMessage(requestData)) {
            console.log('Request', method, data);
            window.ddpMessage[requestData.id] = resolve;
        } else {
            rejects({ code: 400, message: 'not in vscode' });
        }
    })
}

export const handelResponse = (data) => {
    if (window.ddpMessage[data.id]) {
        window.ddpMessage[data.id](data);
        delete window.ddpMessage[data.id];
    } else {
        console.info('No handelResponse resolve:', data);
    }
}

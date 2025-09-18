/**
 * 获取一个字符串()内的内容
 * @param {string} str - 输入的字符串
 * @returns 
 */
const getBracketContent = (str) => {
    const match = str.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
}

/**
 * 字符串去除()以及括号内的内容
 * @param {string} str - 输入的字符串
 * @returns 
 */
const removeBracketContent = (str) => {
    return str.replace(/\s*\([^)]*\)/g, '').trim();
}


export function getTextWidthCanvas(text, font) {
    let canvas = getTextWidthCanvas.canvas || (getTextWidthCanvas.canvas = document.createElement("canvas"));
    let context = canvas.getContext("2d");
    context.font = font;
    let metrics = context.measureText(text);
    // console.log('metrics---', metrics)
    return metrics.width
}

/**
 * 获取vscode主题色
 * @param {*} propText 
 * @returns 
 */
export function getVScodeColor(propText){
  return getComputedStyle(document.documentElement).getPropertyValue(propText);
}

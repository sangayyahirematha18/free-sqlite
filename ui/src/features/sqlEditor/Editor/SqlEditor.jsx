import React, {
  useImperativeHandle,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from "react";
import * as monaco from "monaco-editor";
import { editor, languages } from "monaco-editor";
import { debounce } from "lodash";
// 导入 codicon 字体
import codicon from "monaco-editor/esm/vs/base/browser/ui/codicons/codicon//codicon.ttf";
import { language as sqlLanguage } from "monaco-editor/esm/vs/basic-languages/sql/sql.js";

import {
  sqlAutoComplete,
  getTableSuggest,
  getClomnSuggest,
  formatSQL,
} from "./utils";

const { keywords } = sqlLanguage;

const defaultOptions = {
  selectOnLineNumbers: true,
  roundedSelection: false,
  cursorStyle: "line",
  readOnly: false,
  fontSize: 16,
  minimap: {
    // 小地图配置
    enabled: false, // 禁用小地图
  },
  glyphMargin: true,
  folding:false,
  automaticLayout: true, // 自动布局
  scrollBeyondLastLine: false, // 不允许滚动超过最后一行
  glyphMargin: false,
};

const languageDef = "sql"; // 语言，默认 SQL

// 加载字体的异步函数
export async function loadFont(fontFamily, url) {
  const font = new FontFace(fontFamily, `local(${fontFamily}), url(${url})`);
  await font.load();
  document.fonts.add(font);
}

export const SqlEditor = forwardRef((props, ref)=> {
  const {
    theme = "naruto", // 主题
    autoComplete = sqlAutoComplete, // 默认sql自动补全
    options = {}, // 编辑器选项
    dataBase = [], //数据库表数据
  } = props;

  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };

  const editorContainerRef = useRef(null);
  const $editor = useRef();// 编辑器引用
  // const [monacoEditor, setMonacoEditor] = useState(null);
  const monacoEditor = monaco.editor

  useEffect(() => {
    editor.setTheme(`vs-${theme}`); // 设置主题
  }, [theme]);

    // 初始化编辑器
  useEffect(() => {
    console.log('monacoEditor:', monacoEditor)
    console.log('editorContainerRef.current:', editorContainerRef.current)
    if (monacoEditor && editorContainerRef.current) {
      // 加载 codicon 字体
      loadFont("codicon", codicon);

      // 注册 SQL 语言
      monaco.languages.register({ id: languageDef });
      monaco.languages.setMonarchTokensProvider(languageDef, sqlLanguage);

      // 创建编辑器实例
      $editor.current = monacoEditor.create(editorContainerRef.current, {
        language: languageDef,
        ...mergedOptions
      });
      // 设置语言为 SQL
    }
  }, []);

  //动态引入
  // useEffect(() => {
  //   console.log('----------useEffect------------', monaco.editor)
  //   const loadMonaco = async () => {
  //     const monacoModule = (await import("monaco-editor")).editor;
  //     setMonacoEditor(monacoModule);
  //   };
  //   loadMonaco();
  // }, []);

  // 定义 format 方法
  const format = () => {
    if ($editor.current) {
      $editor.current.setValue(formatSQL($editor.current.getValue()));
    }
  };

   // 暴露引用给父组件
  useImperativeHandle(ref, () => ({
    editor: $editor.current,
    monaco,
    format,
  }));

   // 注册自动补全提供者
  useEffect(() => {
    let CPDisposable;
    if ($editor.current && autoComplete) {
      const _model = $editor.current.getModel();
      const _position = $editor.current.getPosition();
      if (_model && _position) {
        CPDisposable = languages.registerCompletionItemProvider(languageDef, {
          triggerCharacters: [".", ...keywords],
          provideCompletionItems: (model, position) => {
            let suggestions = [];
            const { lineNumber, column } = position;
            /* 获取当前光标所在行的文本 */
            const beforeEditingText = model.getValueInRange({
              startLineNumber: lineNumber,
              startColumn: 0,
              endLineNumber: lineNumber,
              endColumn: column,
            });
            /* 正在编辑的单词 */
            const tokens = beforeEditingText.trim().split(/\s+/);
            const editingWord = tokens[tokens.length - 1];
            /* .结尾 */
            if (editingWord?.endsWith(".")) {
              const wordNoDot = editingWord.slice(0, editingWord.length - 1);
              suggestions = [...getClomnSuggest(dataBase, wordNoDot)];
            } else if (editingWord === ".") {
              /* .开头 */
              suggestions = [];
            } else {
              suggestions = [
                ...getTableSuggest(dataBase),
                ...autoComplete(model, position),
              ];
            }
            return {
              suggestions,
            };
          },
        });
      }
    }
    // 组件卸载时销毁自动补全提供者
    return () => {
      CPDisposable && CPDisposable.dispose();
    };
  }, [$editor.current, autoComplete, dataBase]);


  // 组件卸载时销毁编辑器实例
  useEffect(() => {
    resizeObserver.observe(editorContainerRef.current);
    return () => {
      if ($editor.current) {
        $editor.current.dispose();
      }
    };
  }, []);
   const resizeObserver = new ResizeObserver(([entry] = []) => {
      const [size] = entry.borderBoxSize || [];
      debounceRender(size.inlineSize, size.blockSize);
    });
  
    const debounceRender = debounce(async (width, height) => {
      if ($editor.current) {
        $editor.current.layout();
      }
    }, 200);

  return (
    <div
      ref={editorContainerRef}
      id='tests4'
      style={{
        width: "100%", 
        height:  "100%" ,
      }}
    >
    </div>
  );
})

import { useRef, useImperativeHandle, forwardRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Card, message, Space } from 'antd';

import { tableTree, executeSqlAsync } from '../../../stores/sqlSlice';
import { vsTheme } from '../../../stores/homeSlice';

import { SqlEditor } from "./SqlEditor";

const Editor = forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const editorRef = useRef(null);

  const iTableTree = useSelector(tableTree);
  const iVsTheme = useSelector(vsTheme);

  const handleExecuteSql = async () => {
    console.log('editorRef.current:', editorRef.current);
    const currentSql = editorRef.current?.editor?.getValue() || '';
    console.log('currentSql:', currentSql);
    if (currentSql) {
      const result = await dispatch(executeSqlAsync({ sql: currentSql }));
      // console.log('SQL 执行结果:', result);
      if (result.payload.errorCode !== 200) {
        messageApi.error('SQL语句执行失败, 请检查SQL语句是否正确');
      }
    }
  }

  // 暴露引用给父组件
  useImperativeHandle(ref, () => ({
    editor: editorRef.current,
    format: () => editorRef.current?.format(),
    getValue: () => editorRef.current?.editor?.getValue(),
    setValue: (value) => editorRef.current?.editor?.setValue(value),
    executeSql: handleExecuteSql
  }));

  return (
    <Card
      variant="borderless"
      size="small"
      extra={<Space>{props.toolBarExtra}</Space>}
      style={{ height: '100%', boxShadow: 'none' }}
      styles={{
        body: { padding: '8px 0 0 0', height: 'calc(100% - 38px)' },
      }}
    >
      <SqlEditor style={{ height: '100%' }} theme={iVsTheme} dataBase={iTableTree} ref={editorRef} />
      {contextHolder}
    </Card>
  );
});

export default Editor;

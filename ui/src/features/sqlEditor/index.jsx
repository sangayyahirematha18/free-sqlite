import { useRef } from "react";
import { Splitter, Divider, Button, Dropdown } from 'antd';
import { ConsoleSqlOutlined, PlayCircleOutlined, StarOutlined, FileExcelOutlined, FileTextOutlined, DownOutlined, ExportOutlined } from '@ant-design/icons';

import Editor from "./Editor";
import QueryResult from './QueryResult';
import TableTree from "./TableTree";
import Favorite from "./Favorite";

const exportItems = [
  {
    label: 'CSV',
    key: 'csv',
    icon: <FileTextOutlined />,
  },
  {
    label: 'Excel',
    key: 'excel',
    icon: <FileExcelOutlined />,
  }
]

const SqlEditor = () => {
  const editorRef = useRef(null);
  const favoriteRef = useRef(null);
  const queryResultRef = useRef(null);

  const toolBar = [
    <Button
      size="small"
      color="pink"
      variant="outlined"
      icon={<StarOutlined />}
      onClick={() => favoriteRef.current.handleAddFavorite()}
    >
      Add
    </Button>,
    <Button
      size="small"
      icon={<ConsoleSqlOutlined />}
      onClick={() => editorRef.current.format()}
    >
      Format
    </Button>,
    <Button
      type="primary"
      size="small"
      icon={<PlayCircleOutlined />}
      onClick={() => editorRef.current.executeSql()}
    >
      Run Query
    </Button>,
    <Divider type="vertical" key='splicv1' />,
    <Dropdown
      menu={{
        items: exportItems,
        onClick: ({ key }) => {
          if (key === 'csv') {
            queryResultRef.current.exportToCsv();
          } else if (key === 'excel') {
            queryResultRef.current.exportToExcel();
          }
        }
      }}
      key='export'
    >
      <Button size="small" icon={<ExportOutlined />}>
        Export <DownOutlined />
      </Button>
    </Dropdown>

  ];

  return (
    <Splitter layout="vertical" style={{ height: '100%' }}>
      <Splitter.Panel defaultSize={'45%'}>
        <Splitter>
          <Splitter.Panel>
            <Editor toolBarExtra={toolBar} ref={editorRef} />
          </Splitter.Panel>
          <Splitter.Panel defaultSize={'20%'} collapsible={true}>
            <Favorite ref={favoriteRef} editorRef={editorRef} />
          </Splitter.Panel>
          <Splitter.Panel defaultSize={'20%'}>
            <TableTree />
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
      <Splitter.Panel>
        <QueryResult ref={queryResultRef} />
      </Splitter.Panel>
    </Splitter>
  );
};

export default SqlEditor;
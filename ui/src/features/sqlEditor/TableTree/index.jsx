import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Tree, Empty, Tag, Space } from 'antd';
import { KeyOutlined, TableOutlined } from '@ant-design/icons';

import { tableTree, tableTreeStatus, getAllTablesAsync, executeSqlAsync } from '../../../stores/sqlSlice';

const TableTree = () => {
  const dispatch = useDispatch();

  const iTableTree = useSelector(tableTree);
  const iTableTreeStatus = useSelector(tableTreeStatus);

  useEffect(() => {
    dispatch(getAllTablesAsync());
  }, [dispatch]);

  const treeData = useMemo(() => {
    return iTableTree.map((item) => ({
      title: item.tableName,
      key: item.tableName,
      children: item.columns ? item.columns.map((child) => ({
        title: (<Space>{child.name}<Tag>{child.type}</Tag></Space>),
        key: `${item.tableName}-${child.cid}`,
        icon: child.pk ? <KeyOutlined style={{ color: '#ffc53d' }} /> : null,
      })) : [],
    }));
  }, [iTableTree]);

  console.log('iTableTree-', iTableTree)

  const handelSelectTable = (tableName) => {
    const sql = `SELECT * FROM ${tableName};`;
    dispatch(executeSqlAsync({ sql }));
  };

  const onDoubleClick = (event, node) => {
    console.log('double click node:', node);
    if (node && node.title && node.children && node.children.length > 0) {
      // 双击表名，插入到编辑器
      handelSelectTable(node.title);
    }
  };

  return (
    <Card
      variant="borderless"
      size="small"
      style={{ height: '100%', boxShadow: 'none' }}
      styles={{
        body: { height: 'calc(100% - 38px)', overflow: 'auto' },
      }}
      loading={iTableTreeStatus === 'loading'}
      title={<i style={{fontStyle:'normal'}}><TableOutlined/> Tables</i>}
    >
      {treeData.length > 0 ? (
        <Tree
          treeData={treeData}
          autoExpandParent
          blockNode
          showLine
          showIcon
          selectable={false}
          onDoubleClick={onDoubleClick}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
};

export default TableTree;

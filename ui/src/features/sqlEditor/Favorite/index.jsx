import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { get } from 'lodash';
import { Card, Button, message, Dropdown, Tooltip, Table, Space } from 'antd';
import { FormOutlined, DeleteOutlined, PlayCircleOutlined, EllipsisOutlined, StarOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { favoriteList, favoriteListStatus, getUserFavoritesAsync, removeUserFavoriteAsync, executeSqlAsync, sortUserFavoritesAsync, setFavoriteList } from '../../../stores/sqlSlice';

import AddOrEditModal from './AddOrEditModal';

const Row = props => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });
  const style = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 999 } : {}),
  };
  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
};

const Favorite = forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const { editorRef } = props;

  const iFavoriteList = useSelector(favoriteList);
  const iFavoriteListStatus = useSelector(favoriteListStatus);

  const [favoriteOpen, setFavoriteOpen] = useState(false);
  const [currentFavorite, setCurrentFavorite] = useState(null);

  useEffect(() => {
    dispatch(getUserFavoritesAsync());
  }, [dispatch]);

  const handleAddFavorite = () => {
    console.log('handleAddFavorite currentSql:', editorRef.current.getValue());
    if (!editorRef.current?.getValue()) {
      messageApi.warning('Please enter SQL statement');
      return;
    }
    setFavoriteOpen(true);
  }

  const handleRemoveFavorite = async (id) => {
    const removeResult = await dispatch(removeUserFavoriteAsync({ id }));
    // console.log('删除收藏结果:', removeResult);
    if (removeResult.payload.success) {
      messageApi.success('Deleted successfully');
      dispatch(getUserFavoritesAsync());
    } else {
      messageApi.error('Delete failed');
    }
  };

  const handleExecuteSql = async (sql) => {
    if (sql) {
      const result = await dispatch(executeSqlAsync({ sql }));
      // console.log('SQL 执行结果:', result);
      if (result.payload.errorCode !== 200) {
        messageApi.error('SQL execution failed, please check if the SQL statement is correct');
      }
    }
  }

  useImperativeHandle(ref, () => ({
    handleAddFavorite: handleAddFavorite,
  }));

  const handleButtonClick = (item, key) => {
    console.log('click', item, key);
    if (key === 'delete') {
      handleRemoveFavorite(item.fid);
    } else if (key === 'edit') {
      setCurrentFavorite(item);
      setFavoriteOpen(true);
    } else if (key === 'fill') {
      editorRef.current.setValue(item.sqlStr);
      editorRef.current.format();
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // https://docs.dndkit.com/api-documentation/sensors/pointer#activation-constraints
        distance: 1,
      },
    }),
  );

  const onDragEnd = async (e) => {
    const { active, over } = e;
    if (active.id !== over?.id) {
      const activeIndex = iFavoriteList.findIndex(i => i.fid === active.id);
      const overIndex = iFavoriteList.findIndex(i => i.fid === over?.id);
      const newList = arrayMove(iFavoriteList, activeIndex, overIndex);
      await dispatch(setFavoriteList(newList));
      const fidList = get(active, 'data.current.sortable.items', []);
      dispatch(sortUserFavoritesAsync({ fidList }));
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Actions',
      width: 50,
      render: (_, record) => {
        return (
          <Space>
            <Tooltip title="Run Query">
              <a key='play' onClick={() => handleExecuteSql(record.sqlStr)}><PlayCircleOutlined /></a>
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'fill',
                    label: 'View SQL',
                    icon: <ArrowLeftOutlined />
                  },
                  {
                    key: 'edit',
                    icon: <FormOutlined />,
                    label: 'Rename'
                  },
                  {
                    key: 'delete',
                    danger: true,
                    icon: <DeleteOutlined />,
                    label: 'Delete'
                  }
                ],
                onClick: ({ key }) => handleButtonClick(record, key)
              }}
            >
              <a key='more'><EllipsisOutlined /></a>
            </Dropdown>
          </Space>
        );
      }
    }
  ];

  return (
    <>
      <Card
        variant="borderless"
        size="small"
        style={{ height: '100%', boxShadow: 'none' }}
        styles={{
          body: { height: 'calc(100% - 38px)', overflow: 'auto', padding: '1px 0 0 0' },
        }}
        title={<i style={{ fontStyle: 'normal' }}><StarOutlined /> Favorites</i>}
        extra={<Button color="primary" variant="text" size="small" icon={<ReloadOutlined />} onClick={() => dispatch(getUserFavoritesAsync())} />}
      >
        <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext
            // rowKey array
            items={iFavoriteList.map(i => i.fid)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              showHeader={false}
              size='small'
              components={{
                body: { row: Row },
              }}
              rowKey="fid"
              columns={columns}
              loading={iFavoriteListStatus === 'loading'}
              dataSource={iFavoriteList}
              pagination={false}
            />
          </SortableContext>
        </DndContext>
      </Card>
      <AddOrEditModal
        isOpen={favoriteOpen}
        sql={editorRef.current?.getValue()}
        favorite={currentFavorite}
        onClose={() => { setFavoriteOpen(false); setCurrentFavorite(null); }}
      />
      {contextHolder}
    </>
  );
});

export default Favorite;
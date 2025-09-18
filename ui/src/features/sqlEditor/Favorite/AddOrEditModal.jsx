import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, Form, Input, message } from 'antd';
import { get } from 'lodash';
import { addUserFavoriteAsync, renameUserFavoriteAsync, getUserFavoritesAsync } from '../../../stores/sqlSlice';

const AddOrEditModal = props => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { isOpen, sql, favorite, onClose } = props;

  useEffect(() => {
    if (favorite) {
      form.setFieldsValue({ name: favorite.name });
    }
  }, [favorite, form]);

  const onCreate = async (values) => {
    console.log('Received values from form: ', values);
    if (favorite) {
      // 编辑
      const res = await dispatch(renameUserFavoriteAsync({ id: favorite.fid, name: values.name }));
      if (get(res, 'payload.success')) {
        messageApi.open({
          type: 'success',
          content: '重命名成功',
        });
        onClose();
        form.resetFields();
        dispatch(getUserFavoritesAsync());
      } else {
        messageApi.open({
          type: 'error',
          content: '重命名失败，请稍后重试',
        });
      }
    } else {
      // 新增
      const res = await dispatch(addUserFavoriteAsync({ name: values.name, sql }));
      if (get(res, 'payload.success')) {
        messageApi.open({
          type: 'success',
          content: '加入成功',
        });
        onClose();
        form.resetFields();
        dispatch(getUserFavoritesAsync());
      } else {
        messageApi.open({
          type: 'error',
          content: '加入失败，请稍后重试',
        });
      }
    }
  }

  console.log('isOpen:', isOpen)

  return (
    <Modal
      title={favorite ? '重命名' : '加入收藏夹'}
      open={isOpen}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      okButtonProps={{ autoFocus: true, htmlType: 'submit' }}
      modalRender={dom => (
        <Form
          name="addOrEditForm"
          form={form}
          labelCol={{ span: 4 }}
          clearOnDestroy
          onFinish={values => onCreate(values)}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item label="名称" name='name'>
        <Input showCount maxLength={15} />
      </Form.Item>
      {contextHolder}
    </Modal>
  );
};

export default AddOrEditModal;
import { Button, Card, Form, Input, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { SearchParams, search } from '../services/api';
import { TenantSelector } from './TenantSelector';
import { ClassSelector } from './ClassSelector';

export const Search = () => {
  const [form] = Form.useForm();
  const [tenant, setTenant] = useState<string>();
  const [className, setClassName] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const handleSearch = async (values: any) => {
    if (!tenant || !className) return;

    setLoading(true);
    try {
      const params: SearchParams = {
        className,
        properties: ['*'],
        keyword: values.keyword || '',
        offset: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
      };

      const { data: result } = await search(tenant, params);
      setData(result.data);
      setTotal(result.count);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  useEffect(() => {
    form.submit();
  }, [pagination, tenant, className]);

  const columns = data[0]
    ? Object.keys(data[0]).map((key) => ({
        title: key,
        dataIndex: key,
        key,
        render: (value: any) =>
          typeof value === 'object' ? JSON.stringify(value) : value,
      }))
    : [];

  return (
    <Card>
      <Form form={form} onFinish={handleSearch}>
        <Space style={{ marginBottom: 16 }}>
          <TenantSelector
            value={tenant}
            onChange={setTenant}
            className="w-[200px]"
          />
          <ClassSelector
            tenant={tenant || ''}
            value={className}
            onChange={setClassName}
            className="w-[200px]"
          />
          <Form.Item name="keyword" noStyle>
            <Input.Search
              placeholder="输入关键词搜索"
              className="w-[300px]"
              allowClear
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            搜索
          </Button>
        </Space>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record) => record.id || JSON.stringify(record)}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        onChange={handleTableChange}
        loading={loading}
        scroll={{ x: true }}
      />
    </Card>
  );
}; 
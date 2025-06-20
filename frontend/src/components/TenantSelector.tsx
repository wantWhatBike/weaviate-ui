import { Select, Spin } from 'antd';
import { useEffect, useState } from 'react';
import {getClassTenants, Tenant} from '../services/api';

interface TenantSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const TenantSelector = ({ value, onChange, className }: TenantSelectorProps) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTenants = async () => {
      setLoading(true);
      try {
        const { data } = await getClassTenants(className);
        setTenants(data);
        // 如果没有选中的租户,默认选择第一个
        if (!value && data.length > 0) {
          onChange?.(data[0].name);
        }
      } catch (error) {
        console.error('Failed to load tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, []);

  return (
    <Select
      className={className}
      value={value}
      onChange={onChange}
      loading={loading}
      placeholder="选择租户"
      notFoundContent={loading ? <Spin size="small" /> : null}
      options={tenants.map((tenant) => ({
        label: tenant.name,
        value: tenant.name,
      }))}
    />
  );
}; 
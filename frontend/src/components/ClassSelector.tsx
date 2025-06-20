import { Select, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { getSchema } from '../services/api';

interface ClassSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

interface SchemaClass {
  class: string;
  description?: string;
}

export const ClassSelector = ({  value, onChange, className }: ClassSelectorProps) => {
  const [classes, setClasses] = useState<SchemaClass[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      try {
        const schemas = await getSchema();
        setClasses(schemas.classes || []);
        // 如果没有选中的类,默认选择第一个
        if (!value && schemas.classes.length > 0) {
          onChange?.(schemas.classes[0].class);
        }
      } catch (error) {
        console.error('Failed to load classes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []); // 移除 tenant 依赖，因为 schema 获取不依赖于 tenant

  return (
    <Select
      className={className}
      value={value}
      onChange={onChange}
      loading={loading}
      placeholder="选择类"
      notFoundContent={loading ? <Spin size="small" /> : null}
      options={classes.map((cls) => ({
        label: cls.class,
        value: cls.class,
        description: cls.description,
      }))}
      // optionRender={(option) => (
      //   <div>
      //     <div>{option.data.label}</div>
      //     {option.data.description && (
      //       <div style={{ fontSize: '12px', color: '#999' }}>
      //         {option.data.description}
      //       </div>
      //     )}
      //   </div>
      // )}
    />
  );
}; 
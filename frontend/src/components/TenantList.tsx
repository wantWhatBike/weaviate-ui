import React, { useEffect, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { getTenants } from '../services/api';

interface Tenant {
    name: string;
    activityStatus: string;
}

interface TenantListProps {
    className: string;
    onTenantSelect: (tenant: string) => void;
}

export default function TenantList({ className, onTenantSelect }: TenantListProps) {
    console.log('TenantList rendered with className:', className);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('TenantList useEffect triggered with className:', className);
        const fetchTenants = async () => {
            console.log('Fetching tenants for class:', className);
            try {
                const response = await getTenants(className);
                console.log('Tenants API response:', response);
                setTenants(Array.isArray(response) ? response : []);
            } catch (error) {
                console.error('Failed to fetch tenants:', error);
                setTenants([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, [className]);

    const columns = [
        {
            title: 'Tenant ID',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Status',
            dataIndex: 'activityStatus',
            key: 'activityStatus',
        }
    ];

    return (
        <div>
            <h2>Tenants for Class: {className}</h2>
            <ProTable
                columns={columns}
                dataSource={tenants}
                loading={loading}
                search={false}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                }}
                onRow={(record) => ({
                    onClick: () => onTenantSelect(record.name),
                    style: { cursor: 'pointer' }
                })}
                toolBarRender={false}
            />
        </div>
    );
} 
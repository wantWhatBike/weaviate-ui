import React, {useEffect, useRef, useState} from "react";
import {getClassData} from "./services/api";
import {ActionType, ProTable} from "@ant-design/pro-components";
import { message } from 'antd';

interface ClassDataProps {
    pathname: string;
    tenant: string;
    propties: Array<{name: string}>;
}

export default function ClassData({pathname, tenant, propties}: ClassDataProps) {
    const className = pathname.split('/class/')[1];
    const propertyNames = propties.map(x => x.name);
    const [keyword, setKeyword] = useState("none");
    const [clzData, setClzData] = useState([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (!tenant) {
            console.error('Tenant is undefined');
            message.error('Tenant information is missing');
            return;
        }

        const fetchData = async () => {
            try {
                const data = await getClassData(className, tenant, 0, 20, keyword);
                const dataArray = Array.isArray(data.data) ? data.data : 
                                (data.data && Object.keys(data.data).length > 0 ? [data.data] : []);
                setClzData(dataArray);
                setTotal(data.count || 0);
            } catch (error) {
                console.error('Error fetching class data:', error);
                message.error('Failed to fetch class data');
            }
        };

        fetchData();
    }, [className, tenant, keyword]);

    const columns = [
        {
            title: 'Id',
            dataIndex: 'index',
            width: 48,
        },
        ...propties.map(prop => ({
            title: prop.name,
            dataIndex: prop.name,
        }))
    ];

    const transformData = (rawData: any[]) => {
        if (!Array.isArray(rawData) || rawData.length === 0) {
            return [];
        }
        return rawData.map((clz: any) => {
            // Handle case where clz might be null or undefined
            if (!clz || !clz._additional) {
                return {
                    key: Math.random(),
                    index: 'N/A',
                    ...propertyNames.reduce((acc, prop) => ({
                        ...acc,
                        [prop]: 'N/A'
                    }), {})
                };
            }
            return {
                ...propertyNames.reduce((acc, prop) => ({
                    ...acc,
                    [prop]: clz[prop] || 'N/A'
                }), {}),
                index: clz['_additional']['id'] || 'N/A',
                key: Math.random()
            };
        });
    };

    const ref = useRef<ActionType>();

    return (
        <div>
            <ProTable
                actionRef={ref}
                params={{pathname}}
                columns={columns}
                request={async (params: any) => {
                    try {
                        const response = await getClassData(
                            className,
                            tenant,
                            (params.current - 1) * params.pageSize,
                            params.pageSize,
                            keyword
                        );
                        
                        const dataArray = Array.isArray(response.data) ? response.data : 
                                        (response.data && Object.keys(response.data).length > 0 ? [response.data] : []);
                        
                        return {
                            data: transformData(dataArray),
                            success: true,
                            total: response.count || 0,
                        };
                    } catch (error) {
                        console.error('Error in ProTable request:', error);
                        message.error('Failed to fetch data');
                        return {
                            data: [],
                            success: false,
                            total: 0,
                        };
                    }
                }}
                rowKey="key"
                dateFormatter="string"
                toolbar={{
                    title: 'Class',
                    tooltip: '',
                    search: {
                        onSearch: (value: string) => {
                            setKeyword(value || 'none');
                            ref.current?.reload();
                        },
                    },
                }}
                search={false}
                toolBarRender={() => []}
            />
        </div>
    );
}


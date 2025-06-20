import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:7777',
});

export interface Tenant {
  name: string;
  activityStatus: string;
}

export interface SearchParams {
  className: string;
  properties: string[];
  keyword: string;
  offset: number;
  limit: number;
  filters?: {
    path: string[];
    operator: string;
    valueText: string;
  }[];
  sort?: {
    path: string;
    desc: boolean;
  }[];
  groupBy?: string[];
  crossClass?: boolean;
}

export interface SearchResult {
  data: any;
  count: number;
}

// Schema 管理
export const getSchema = () => api.get(`/schema`).then(res=>res.data);

// class tenants
export const getClassTenants = (className: string) =>
  api.get<Tenant[]>(`/class/${className}/tenants`);

// 数据查询
export const search = (tenant: string, params: SearchParams) => 
  api.post<SearchResult>(`/search/${tenant}`, params);

// 兼容旧版查询
export const getClass = (
  className: string,
  tenant: string,
  offset: number,
  limit: number,
  keyword: string,
  properties: string[]
) =>
  api.post<SearchResult>(
    `/class/${className}/${tenant}/${offset}/${limit}/${keyword}`,
    properties
  );

export async function getTenants(className: string) {
    console.log('getTenants called with className:', className);
    const url = `/tenants/${className}`;
    console.log('API URL:', `${api.defaults.baseURL}${url}`);
    try {
        const response = await api.get(url, {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        console.log('getTenants response:', response);
        return response.data;
    } catch (error) {
        console.error('getTenants error:', error);
        throw error;
    }
}

export const getClassData = async (className: string, tenant: string, offset: number, limit: number, keyword: string) => {
    console.log('getClassData called with:', { className, tenant, offset, limit, keyword });
    const url = `/class/${className}/tenant/${tenant}/${offset}/${limit}/${keyword}`;
    console.log('API URL:', `${api.defaults.baseURL}${url}`);
    try {
        const response = await api.post(url);
        console.log('getClassData response:', response);
        return response.data;
    } catch (error) {
        console.error('getClassData error:', error);
        throw error;
    }
};
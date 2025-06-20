import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

export interface Tenant {
  id: string;
  name: string;
  host: string;
  apiKey: string;
  scheme: string;
  disabled: boolean;
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

// 租户管理
export const getTenants = () => api.get<Tenant[]>('/tenants');
export const addTenant = (tenant: Tenant) => api.post<Tenant>('/tenants', tenant);

// Schema 管理
export const getSchema = (tenant: string) => api.get(`/schema/${tenant}`);
export const getClassProperties = (tenant: string, className: string) => 
  api.get<string[]>(`/class/${tenant}/${className}/properties`);
export const getClassTenants = (className: string) => 
  api.get<string[]>(`/class/${className}/tenants`);

// 数据查询
export const search = (tenant: string, params: SearchParams) => 
  api.post<SearchResult>(`/search/${tenant}`, params);

// 兼容旧版查询
export const queryClass = (
  tenant: string,
  className: string,
  offset: number,
  limit: number,
  keyword: string,
  properties: string[]
) =>
  api.post<SearchResult>(
    `/class/${tenant}/${className}/${offset}/${limit}/${keyword}`,
    properties
  ); 
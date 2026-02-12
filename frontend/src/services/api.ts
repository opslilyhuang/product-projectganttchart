/**
 * API服务层 - 封装HTTP请求
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

// 自定义Axios实例类型，响应拦截器已经解包了data
interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> {
  get<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  post<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  put<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  patch<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  delete<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
}

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;

      if (status === 401) {
        // 认证失败，清除token并跳转到登录页
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      return Promise.reject(data?.error || `请求失败: ${status}`);
    } else if (error.request) {
      // 请求已发出但没有响应
      return Promise.reject('网络连接失败，请检查网络');
    } else {
      // 请求配置错误
      return Promise.reject('请求配置错误');
    }
  }
);

// 导出具有正确类型的api实例
export default api as CustomAxiosInstance;
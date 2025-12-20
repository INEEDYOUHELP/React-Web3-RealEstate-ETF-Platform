/**
 * 资产相关的常量定义
 * 用于统一管理资产类型、地区等选项
 */

// 地区选项（与资产展示页面保持一致）
export const REGIONS = ['北美', '欧洲', '亚太', '中东'] as const;
export type Region = typeof REGIONS[number];

// 类型选项（与资产展示页面保持一致）
export const PROPERTY_TYPES = ['商业地产', '住宅地产', '零售地产'] as const;
export type PropertyType = typeof PROPERTY_TYPES[number];

// 标签选项（可选，用于资产标签）
export const TAGS = ['热门', '高收益', '推荐', '稳定收益', '新上线', '豪华', '长期稳定', '超高收益', '新兴', '新兴市场'] as const;
export type Tag = typeof TAGS[number];


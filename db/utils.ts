/**
 * 表名生成工具函数
 *
 * 根据环境变量PROJECT_NAME生成带前缀的表名
 * 例如，当PROJECT_NAME=example时，getTableName("user") 将返回 "example_user"
 */
export function getTableName(baseName: string): string {
  const prefix = process.env.PROJECT_NAME || '';
  return prefix ? `${prefix}_${baseName}` : baseName;
}

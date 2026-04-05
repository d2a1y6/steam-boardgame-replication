/**
 * 功能概述：集中维护当前序列化格式的 schema version。
 * 输入输出：不接收运行时输入；导出一个稳定的整型版本号。
 * 处理流程：后续新增迁移时，只在这里提升版本并补对应迁移逻辑。
 */

export const SAVE_SCHEMA_VERSION = 2;

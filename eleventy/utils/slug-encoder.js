/**
 * BV风格短ID编码器
 * 将中文或其他字符串转换为短字符串ID
 * 
 * 原理：字符串 → 哈希数字 → Base58编码 → 短ID
 */

// Base58 字符集（去掉了容易混淆的 0OIl）
const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * 简单哈希函数（将字符串转换为数字）
 * 使用 djb2 算法
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; // hash * 33 + char
    hash = hash & hash; // 转为32位整数
  }
  // 转为正数
  return Math.abs(hash);
}

/**
 * 数字转Base58字符串
 */
function encodeBase58(num) {
  if (num === 0) return BASE58_CHARS[0];
  
  let result = '';
  while (num > 0) {
    const remainder = num % 58;
    result = BASE58_CHARS[remainder] + result;
    num = Math.floor(num / 58);
  }
  return result;
}

/**
 * 将字符串编码为短ID
 * @param {string} str - 原始字符串（如中文标题）
 * @param {object} options - 配置选项
 * @param {string} options.prefix - 前缀，默认 'p'（post）
 * @param {number} options.minLength - 最小长度，默认 6
 * @returns {string} 短ID
 */
function encodeSlug(str, options = {}) {
  const { prefix = 'p', minLength = 6 } = options;
  
  // 计算哈希值
  const hash = hashString(str);
  
  // 编码为Base58
  let encoded = encodeBase58(hash);
  
  // 如果长度不足，用前导字符填充
  while (encoded.length < minLength) {
    encoded = BASE58_CHARS[0] + encoded;
  }
  
  return prefix + encoded;
}

/**
 * 批量编码，用于检查碰撞
 * @param {string[]} strings - 字符串数组
 * @returns {Map<string, string>} 原字符串 -> 编码结果
 */
function batchEncode(strings) {
  const result = new Map();
  const usedIds = new Set();
  
  for (const str of strings) {
    let id = encodeSlug(str);
    let counter = 0;
    
    // 处理碰撞（极低概率，但保险起见）
    while (usedIds.has(id)) {
      counter++;
      id = encodeSlug(str + counter);
    }
    
    usedIds.add(id);
    result.set(str, id);
  }
  
  return result;
}

module.exports = {
  encodeSlug,
  batchEncode,
  hashString,
  encodeBase58
};

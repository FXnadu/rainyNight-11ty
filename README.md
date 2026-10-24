# RainyNight

一个基于 [Eleventy (11ty) v3](https://www.11ty.dev/) 的开源静态博客 / 知识库主题。零框架、纯原生 CSS/JS，内置分类体系、标签、时间归档、全站搜索、暗色模式与丰富的 Markdown 渲染能力，适合做个人知识库、教程站或文档博客。

## 特性

- **内容组织**：按目录层级自动生成父子分类，支持标签云与按月归档三种浏览方式
- **全站搜索**：基于 `search.json` 的客户端检索，覆盖标题、分类、摘要与正文关键词
- **Markdown 增强**：GitHub Alerts 提示块、脚注、任务列表、`==高亮标记==`、代码语法高亮、Mermaid 图表
- **明暗主题**：跟随系统或手动切换的暗色模式，全站响应式布局
- **易配置**：品牌、导航、页脚、SEO、分页与所有页面文案集中在单一配置文件
- **URL 安全**：中文标题自动编码为短 ID，并自动生成旧链接重定向页
- **工程化**：内置 Vitest 单元测试与构建脚本

## 快速开始

环境要求：Node.js 18+

```bash
# 克隆本主题
git clone https://github.com/FXnadu/rainyNight-11ty.git my-site
cd my-site

# 安装依赖
npm install

# 启动本地开发服务器（默认 http://localhost:8080）
npm start

# 构建静态文件到 _site/
npm run build

# 运行测试
npm test
```

## 写作

在 `src/content/posts/` 下按「分类/子分类」的文件夹结构放置 `.md` 文件，分类体系会根据目录自动生成：

```
src/content/posts/
└── 教程/
    └── 基础篇/
        └── 我的第一篇文章.md
```

文章头部使用 front matter：

```yaml
---
title: 我的第一篇文章
date: 2026-01-01
excerpt: 文章摘要（可选，缺省时自动截取正文）
---
```

## 站点配置

所有站点信息与页面文案集中在 `src/_data/siteConfig.js`，开箱即为示例文案，直接替换即可：

| 配置项 | 说明 |
| --- | --- |
| `brand` / `footer` | 站点名称、标语、社交链接 |
| `navigation` | 顶部导航菜单 |
| `meta` | SEO 元信息（标题、描述、作者、站点地址、语言） |
| `theme` | 默认明暗主题 |
| `pagination` | 各列表页分页大小与分页文案 |
| `pages.*` | 首页、分类、标签、归档、说明页的全部文案 |

## 目录结构

```
├── .eleventy.js            # 11ty 配置入口（插件、Markdown、目录）
├── eleventy/config/        # 过滤器、集合、computed 字段、静态资源拷贝
├── src/
│   ├── _data/siteConfig.js # 全站统一配置
│   ├── _includes/          # 布局与模板片段（head / header / footer）
│   ├── assets/             # CSS（按页面拆分）与 JS
│   └── content/
│       ├── pages/          # 独立页面（首页、分类、标签、归档、404 等）
│       ├── posts/          # 文章 Markdown
│       └── redirects/      # 旧链接重定向模板
└── tests/                  # Vitest 测试
```

## 自定义样式

样式按页面模块拆分在 `src/assets/css/` 下（`foundation.css` 定义设计变量，`pages/` 存放各页面样式），修改后由构建流程自动合并，无需手动处理。

## 部署

主题是纯静态站点，`npm run build` 后将 `_site/` 部署到任意静态托管平台即可：

- **GitHub Pages**：用 GitHub Actions 执行构建并发布 `_site/`
- **Netlify / Vercel**：构建命令 `npm run build`，产物目录 `_site`

## 参与贡献

欢迎提交 Issue 和 Pull Request：修复问题、补充文档、新增功能均可。提交前请确保 `npm test` 通过。

## 许可证

[MIT](./LICENSE)

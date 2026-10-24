/**
 * 全站统一配置（Eleventy _data）
 * 集中管理品牌、导航、页脚、SEO、分页与页面文案等。
 * 以下均为示例文案，可直接替换为自己的内容。
 */
const config = {
    brand: {
        logoText: "MyBlog",
        homeUrl: "/"
    },

    navigation: {
        main: [
            { text: "首页", url: "/", icon: "home" }
        ]
    },

    footer: {
        copyrightOwner: "MyBlog",
        tagline: "一个用于记录与分享的静态网站",
        socialLinks: [
            { text: "GitHub", url: "https://github.com", icon: "fa-brands fa-github" }
        ]
    },

    meta: {
        title: "",
        description: "示例站点描述：基于 Eleventy 的博客与知识库主题",
        author: "Your Name",
        email: "your.email@example.com",
        url: "https://example.com",
        lang: "zh-CN"
    },

    theme: {
        default: "light"
    },

    external: {
        fonts: "https://fonts.loli.net/css2?family=Space+Grotesk:wght@300;400;600;700&family=Syncopate:wght@700&family=JetBrains+Mono:wght@400;500&display=block"
    },

    search: {
        resultLimit: 6,
        debounceMs: 200
    },

    pagination: {
        archivePageSize: 20,
        categoryPageSize: 16,
        recordsPageSize: 8,
        labels: {
            previousPage: "← 上一页",
            nextPage: "下一页 →",
            pageIndicator: "第 {current} / {total} 页"
        }
    },

    pages: {
        home: {
            title: "首页",
            hero: {
                title: "Documentation",
                subtitle: "示例站点副标题",
                descriptionLines: [
                    "这里是一段站点介绍示例文案，",
                    "你可以在此向访客说明站点的内容与用途。"
                ]
            },
            audience: {
                title: "常用",
                items: [
                    {
                        icon: "fa-solid fa-folder-open",
                        title: "内容分类",
                        description: "按分类浏览全部内容",
                        url: "/categories/"
                    },
                    {
                        icon: "fa-solid fa-tags",
                        title: "标签云",
                        description: "通过标签快速筛选文章",
                        url: "/tags/"
                    },
                    {
                        icon: "fa-solid fa-clock-rotate-left",
                        title: "时间归档",
                        description: "按时间线查看历史文章",
                        url: "/archive/"
                    }
                ]
            },

            search: {
                placeholder: "搜索全站内容...",
                buttonLabel: "搜索",
                description: "支持标题、分类、摘要和正文关键词检索，快速找到你需要的内容。",
                examples: "例如：关键词一、关键词二、安装指南..."
            },

            closing: {
                label: "开始浏览",
                headline: "把接触的内容整理清楚 \n 让结果自然生长",
                description: "欢迎访问，这里的内容均为示例文案，可在 siteConfig.js 中替换",
                actionText: "查看内容归档",
                actionUrl: "/categories/"
            }
        },

        categories: {
            sidebarTitle: "归档",
            docUnit: "篇文档",
            monthUnit: "个月份"
        },

        tags: {
            title: "标签分类",
            subtitle: "通过标签快速筛选和浏览相关内容",
            docUnit: "篇文档"
        },

        categoryDetail: {
            allLabel: "全部归档",
            docUnit: "篇文档",
            childUnit: "个月份",
            backToOverview: "← 返回归档总览"
        },

        archive: {
            title: "全部文档",
            subtitle: "暂无简介"
        },

        services: {
            title: "网站说明",
            headerTitle: "Services.",
            subtitleBackground: "网站说明",
            headerMetaLines: ["这里是一段页面介绍示例文案，", "可在 siteConfig.js 中替换为你自己的说明内容。"],
            items: [
                {
                    number: "01",
                    title: "关于本站",
                    description: "本站内容说明（示例）",
                    bullets: [
                        "内容均为示例文案",
                        "适用场景不同，效果因人而异",
                        "内容持续更新迭代",
                    ]
                },
                {
                    number: "02",
                    title: "免责声明",
                    description: "本站内容声明（示例）：",
                    bullets: [
                        "不构成任何建议或保证。",
                        "内容仅供学习参考",
                        "部分内容源自网络，侵删"
                    ]
                },
                {
                    number: "03",
                    title: "联系站长",
                    description: "如有疑问或建议，可通过以下方式联系：",
                    bullets: [
                        { label: "QQ", encoded: "MTIzNDU2Nzg=" },
                        { label: "Email", encoded: "eW91ci5lbWFpbEBleGFtcGxlLmNvbQ==" }
                    ],
                    isProtected: true
                }
            ],
            cta: {
                title: "或许，文档里藏着问题的答案",
                linkText: "看看内容归档 →",
                linkUrl: "/categories/"
            }
        }
    }
};

module.exports = config;

/**
 * 全站统一配置（Eleventy _data）
 * 集中管理品牌、导航、页脚、SEO、分页与页面文案等。
 */
const config = {
    brand: {
        logoText: "helloSummer",
        homeUrl: "/"
    },

    navigation: {
        main: [
            { text: "首页", url: "/", icon: "home" }
        ]
    },

    footer: {
        copyrightOwner: "helloSummer ",
        tagline: "用于记录展示的轻量网站",
        socialLinks: [
            { text: "GitHub", url: "https://github.com", icon: "fa-brands fa-github" }
        ]
    },

    meta: {
        title: "",
        description: "my Tutorial Website",
        author: "helloSummer ",
        email: "contact@deepwhite.dev",
        url: "https://deepwhite.me",
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
                subtitle: "my Tutorial Website",
                descriptionLines: [
                    "my Tutorial Website",
                    "你可以获取自己需要的内容，如果有的话。"
                ]
            },
            audience: {
                title: "常用",
                items: [
                    {
                        icon: "fa-solid fa-briefcase",
                        title: "福星抖音",
                        description: "福星抖音使用教程",
                        targetCategory: "福星抖音"
                    },
                    {
                        icon: "fa-solid fa-briefcase",
                        title: "Personal Q&A",
                        description: "个人所遇问题整理合集",
                        targetCategory: "Personal Q&A"
                    },
                    {
                        icon: "fa-solid fa-link",
                        title: "链接转换工具",
                        description: "长链接转短链接",
                        url: "/"
                    }
                ]
            },

            search: {
                placeholder: "搜索知识库...",
                buttonLabel: "搜索",
                description: "支持标题、分类、摘要和正文关键词检索，快速找到你需要的内容。",
                examples: "例如：电脑蓝屏、报错、线程异常、安装指南..."
            },

            closing: {
                label: "开始浏览",
                headline: "把接触的内容整理清楚 \n 让结果自然生长",
                description: "欢迎访问，所有内容皆为个人整理的笔记与分享",
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
            headerMetaLines: ["从实际出发，", "把结构内容整理清楚，打造清晰易懂的文章。持续更新优化内容，为学习与实践提供可靠参考。"],
            items: [
                {
                    number: "01",
                    title: "本关于教程",
                    description: "本站文章以及教程说明",
                    bullets: [
                        "内容均为实操经验整理",
                        "适用场景不同，效果因人而异",
                        "教程持续更新迭代",
                    ]
                },
                {
                    number: "02",
                    title: "免责声明",
                    description: "本网站任何任何内容非官方，请注意以下声明：",
                    bullets: [
                        "不构成任何建议或保证。",
                        "教程、文章内容仅供学习参考",
                        "部分内容源自网络，侵删"
                    ]
                },
                {
                    number: "03",
                    title: "联系站长",
                    description: "如有疑问或建议，可通过以下方式联系：",
                    bullets: [
                        { label: "QQ", encoded: "MjAzNTA4MzMxMA==" },
                        { label: "Email", encoded: "ZGVlcHdoaXRlODZAb3V0bG9vay5jb20=" }
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

/**
 * 全站统一配置，集中管理可见文案。
 */
const config = {
    brand: {
        logoText: "RN Workspace",
        homeUrl: "/"
    },

    navigation: {
        main: [
            { text: "首页", url: "/" },
            { text: "内容归档", url: "/categories/" },
            { text: "页面说明", url: "/services/" }
        ]
    },

    footer: {
        copyrightOwner: "RainyNight Workspace",
        tagline: "用于记录展示的轻量网站",
        socialLinks: [
            { text: "GitHub", url: "https://github.com", icon: "fa-brands fa-github" },
            { text: "页面说明", url: "/services/", icon: "fa-solid fa-file-lines" }
        ]
    },

    meta: {
        title: "RainyNight | 教程",
        description: "my Tutorial Website",
        author: "RainyNight Workspace",
        email: "contact@rainyNight.dev",
        url: "https://deepwhite.me",
        lang: "zh-CN"
    },

    theme: {
        default: "light"
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
                title: "Welcome ",
                subtitle: "RainyNight's Tutorial Website",
                descriptionLines: [
                    "my Tutorial Website",
                    "你可以直接把它当成电商软件教程网站，获取自己需要的内容。"
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
                        icon: "fa-solid fa-briefcase",
                        title: "抖店相关",
                        description: "抖店FAQ快速导航",
                        targetCategory: "抖店相关"
                    }
                ]
            },

            search: {
                placeholder: "搜索知识库...",
                buttonLabel: "搜索",
                description: "支持标题、分类、摘要和正文关键词检索，快速找到你需要的内容。",
                examples: "例如：限售品牌、指定类目发布、使用教程、安装指南..."
            },

            closing: {
                label: "开始浏览",
                headline: "把接触的内容整理清楚 \n 让结果自然生长",
                description: "欢迎来到我的电商笔记网页，所有内容皆为个人整理的笔记与分享",
                actionText: "查看内容归档",
                actionUrl: "/categories/"
            }
        },

        categories: {
            sidebarTitle: "项目阶段导航",
            docUnit: "篇文档",
            monthUnit: "个月份"
        },

        categoryDetail: {
            allLabel: "全部归档",
            docUnit: "篇文档",
            childUnit: "个月份",
            backToOverview: "← 返回归档总览"
        },

        archive: {
            title: "全部文档",
            subtitle: "按时间查看这套个人网站演示站的所有页面文案与示例文章。"
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
                    description: "本网站非任何软件官方平台，请注意以下声明：",
                    bullets: [
                        "非官方站点，软件售后及问题请咨询官方",
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

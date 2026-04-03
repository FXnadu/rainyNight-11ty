/**
 * 全站统一配置，集中管理可见文案。
 */
const config = {
    brand: {
        logoText: "rainyNight Workspace",
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
        copyrightOwner: "rainyNight Workspace",
        tagline: "用于记录展示的轻量演示站",
        socialLinks: [
            { text: "GitHub", url: "https://github.com", icon: "fa-brands fa-github" },
            { text: "页面说明", url: "/services/", icon: "fa-solid fa-file-lines" }
        ]
    },

    meta: {
        title: "rainyNight Workspace | 个人网站搭建演示站",
        description: "一个面向个人网站搭建的演示站，展示个人主页、作品集、博客的页面文案。",
        author: "rainyNight Workspace",
        email: "contact@rainyNight.dev",
        url: "https://rainyNight.dev",
        lang: "zh-CN"
    },

    theme: {
        default: "light"
    },

    pagination: {
        archivePageSize: 20,
        categoryPageSize: 10,
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
                title: "my personal website ",
                subtitle: "我的个人主页、教程的演示站",
                descriptionLines: [
                    "这是一个面向个人网站搭建的演示站，重点展示页面设计、内容组织和整体表达方式。",
                    "你可以直接把它当成个人网站模板，也可以继续替换成自己的内容。"
                ]
            },
            audience: {
                title: "常用教程",
                items: [
                    {
                        icon: "fa-solid fa-briefcase",
                        title: "福星抖音",
                        description: "福星抖音上货软件使用教程",
                        targetCategory: "开发执行篇"
                    },
                    {
                        icon: "fa-solid fa-pen-nib",
                        title: "福星淘宝",
                        description: "福星淘宝店铺管理软件使用教程",
                        targetCategory: "建站需求篇"
                    },
                    {
                        icon: "fa-solid fa-camera-retro",
                        title: "福星微店",
                        description: "福星微店管理软件使用教程"
                    },
                    {
                        icon: "fa-solid fa-laptop-code",
                        title: "其他",
                        description: "敬请期待..."
                    }
                ]
            },
            features: {
                title: "核心入口",
                items: [
                    {
                        title: "内容归档",
                        description: "查看不同类型的个人网站示例文案，包括页面想法、结构整理和展示方式。",
                        url: "/categories/"
                    },
                    {
                        title: "页面说明",
                        description: "看看这类个人网站通常会包含哪些页面，以及这些页面适合放什么内容。",
                        url: "/services/"
                    }
                ]
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
            title: "内容归档",
            subtitle: "按主题浏览演示文案，快速查看个人网站通常如何组织内容。",
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
            headerMetaLines: ["从个人表达出发", "把结构和内容整理清楚"],
            items: [
                {
                    number: "01",
                    title: "需要注意的是",
                    description: "请勿把该网站当成任何软件官网，所有内容皆为个人整理的笔记与观点分享。以下三点请知晓：",
                    bullets: [
                        "非官方网站，软件问题请咨询官方售后",
                        "教程仅作学习，不承担软件使用后果",
                        "内容仅供学习参考，不代表官方立场"
                    ]
                },
                {
                    number: "02",
                    title: "免责声明",
                    description: "适合作品较多的人，把项目背景、作品说明和相关链接整理成更完整的展示页面。",
                    bullets: [
                        "教程持续更新迭代",
                        "作品说明与链接布局",
                        "适配手机端浏览体验"
                    ]
                },
            ],
            cta: {
                title: "如果你想继续把它改成自己的站点，",
                linkText: "可以看看内容归档 →",
                linkUrl: "/categories/"
            }
        }
    }
};

module.exports = config;

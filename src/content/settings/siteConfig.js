/**
 * 全站统一配置，集中管理可见文案。
 */
const config = {
    brand: {
        logoText: "deepwhitex Workspace",
        homeUrl: "/"
    },

    navigation: {
        main: [
            { text: "首页", url: "/" },
            { text: "内容归档", url: "/categories/" },
            { text: "页面说明", url: "/services/" },
            { text: "联系方式", url: "/contact/" }
        ]
    },

    footer: {
        copyrightOwner: "deepwhitex Workspace",
        tagline: "用于展示个人网站结构、页面示例与写法的轻量演示站",
        socialLinks: [
            { text: "联系我", url: "/contact/", icon: "fa-solid fa-envelope" },
            { text: "微信沟通", url: "/contact/", icon: "fa-brands fa-weixin" },
            { text: "GitHub", url: "https://github.com/FXnadu", icon: "fa-brands fa-github" },
            { text: "页面说明", url: "/services/", icon: "fa-solid fa-file-lines" }
        ]
    },

    meta: {
        title: "deepwhitex Workspace | 个人网站搭建演示站",
        description: "一个面向个人网站搭建的演示站，展示个人主页、作品集、博客和简历站的页面文案。",
        author: "deepwhitex Workspace",
        email: "contact@deepwhitex.dev",
        url: "https://deepwhitex.dev",
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
                subtitle: "适合个人主页、作品集、博客和简历站",
                descriptionLines: [
                    "这是一个面向个人网站搭建的演示站，重点展示页面结构、内容组织和整体表达方式。",
                    "你可以直接把它当成个人网站模板，也可以继续替换成自己的内容。"
                ]
            },
            audience: {
                title: "适合谁使用",
                items: [
                    {
                        icon: "fa-solid fa-briefcase",
                        title: "自由职业者",
                        description: "需要一个能展示自己、作品和联系入口的个人页面。"
                    },
                    {
                        icon: "fa-solid fa-pen-nib",
                        title: "设计师与创作者",
                        description: "想把作品、风格说明和联系入口整理成清晰的个人展示站。"
                    },
                    {
                        icon: "fa-solid fa-camera-retro",
                        title: "摄影师与插画师",
                        description: "希望把作品、擅长方向和联系方式放到一个页面里。"
                    },
                    {
                        icon: "fa-solid fa-laptop-code",
                        title: "个人开发者",
                        description: "想整理自己的项目、文章和个人介绍，做成一个清晰的网站。"
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
                    },
                    {
                        title: "联系方式",
                        description: "把邮箱、即时沟通和其他入口集中在一个页面里，方便继续交流。",
                        url: "/contact/"
                    }
                ]
            },
            closing: {
                label: "开始浏览",
                headline: "先把内容整理清楚\n再慢慢长成你想要的网站",
                description: "这套演示文案更偏向轻量展示，不强调推销，而是先把个人介绍、作品和页面结构讲明白。",
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
            title: "页面说明",
            headerTitle: "Services.",
            subtitleBackground: "个人网站页面说明",
            headerMetaLines: ["从个人表达出发", "把结构和内容整理清楚"],
            items: [
                {
                    number: "01",
                    title: "个人主页与介绍站",
                    description: "适合个人开发者、独立设计师、顾问和内容创作者，用清晰的信息结构展示你是谁、在做什么，以及如何联系你。",
                    bullets: [
                        "首页信息结构策划",
                        "个人介绍与案例展示页",
                        "联系方式与入口整理"
                    ]
                },
                {
                    number: "02",
                    title: "作品集与案例展示站",
                    description: "适合作品较多的人，把项目背景、作品说明和相关链接整理成更完整的展示页面。",
                    bullets: [
                        "作品分类与案例详情页",
                        "作品说明与链接布局",
                        "适配手机端浏览体验"
                    ]
                },
                {
                    number: "03",
                    title: "博客与内容型个人站",
                    description: "适合长期写文章、记录项目或沉淀观点的人，把文章归档、个人介绍和联系入口放在同一套站点里。",
                    bullets: [
                        "文章归档与分类页面",
                        "关于我与内容导航页",
                        "联系页与常见问题整理"
                    ]
                },
                {
                    number: "04",
                    title: "上线部署与基础维护",
                    description: "不只交付页面文件，也会处理域名解析、托管部署、基础 SEO 配置和后续小范围内容维护说明。",
                    bullets: [
                        "静态站点部署上线",
                        "基础元信息与分享配置",
                        "后续内容更新指引"
                    ]
                },
                {
                    number: "05",
                    title: "常见问题说明",
                    description: "如果你想提前整理一些常见问题，比如更新方式、技术选型和维护节奏，可以直接放一个 FAQ 页面。",
                    linkText: "查看常见问题 →",
                    linkUrl: "/posts/faq/"
                }
            ],
            cta: {
                title: "如果你想继续把它改成自己的站点，",
                linkText: "可以去联系页看看 →",
                linkUrl: "/contact/"
            }
        },

        contact: {
            title: "联系方式",
            subtitle: "如果你想继续交流，可以直接发来你喜欢的参考站、想保留的内容，或者简单介绍一下自己的想法。",
            responseTimeText: "通常会在 24 小时内回复。",
            sections: {
                emailTitle: "Email",
                imTitle: "即时沟通",
                socialTitle: "更多入口"
            },
            email: {
                user: "deepwhite86",
                domain: "outlook.com"
            },
            im: {
                wechat: "deepwhite_me",
                qq: "1703452231"
            },
            socials: [
                { text: "页面说明页 →", url: "/services/" },
                { text: "内容归档页 →", url: "/categories/" },
                { text: "GitHub →", url: "https://github.com/FXnadu" }
            ]
        }
    }
};

module.exports = config;

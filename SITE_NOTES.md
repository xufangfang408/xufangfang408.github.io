# 主页维护说明

## 本次内容依据

- 内容以 `local/xufangfang_cv_source.pdf` 为准，姓名中文来自 `local/xufangfang.md`，头像来自 `local/xufangfang.jpg`。
- 同目录的 LaTeX 简历与 PDF 有差异，本次采用 PDF 中的学位、项目时间、研究表述及作者顺序。
- 页面以英文为主，保留中文姓名。Spaceland 标注为 bioRxiv 预印本及 Nature Communications 修回状态；Spaceland-omics、OmicsBind 标注为在研项目。
- 作者姓名后的星号与 PDF 一致，暂未额外解释星号的含义。
- `files/Fangfang-Xu-CV.pdf` 是原 PDF 的直接副本。

## 日常修改入口

| 内容 | 文件 |
| --- | --- |
| 联系方式、论文、项目、教育、荣誉 | `_data/academic.yml` |
| 首页个人介绍与栏目顺序 | `_pages/about.md` |
| 在线 CV | `_pages/cv.md` |
| 顶部导航 | `_data/navigation.yml` |
| 全站标题、简介、域名 | `_config.yml` |
| 页面布局与视觉样式 | `_layouts/academic.html`、`assets/css/academic-v2.css` |
| 公开照片、下载版 CV | `images/fangfang-xu.jpg`、`files/Fangfang-Xu-CV.pdf` |

模板示例文件仍保留在仓库中，但已在 `_config.yml` 中排除，不会作为个人成果发布。`local/` 同样不参与网站生成，且已被 Git 忽略。后续新增论文时，应更新学术数据和页面；不要直接启用模板示例集合。

## 访客地图（2026-10-10）

- 首页 Contact 之后添加独立的 Flag Counter 世界访客地图，使用该站专属计数器 `dkNY`。无需 ClustrMaps 账号，也未提交邮箱。公开统计页为 <https://info.flagcounter.com/dkNY>。
- 地图最大宽度为 480px，居中显示，手机端随内容区域缩小。图片保留 600:291 比例；明暗主题沿用现有标题、分隔线和文字颜色，地图保留原始配色与服务署名。加载较慢或失败时保留同样尺寸并显示简短提示，打印页面隐藏地图。
- 修改入口是 `_config.yml` 的 `visitor_map`；设置 `enabled: false` 可隐藏地图。保留 `image_url` 与 `stats_url` 中的 `dkNY`，可让后续部署继续累计同一份数据。模板、样式及失败处理分别位于 `_includes/visitor-map.html`、`assets/css/academic-v2.css`、`assets/js/visitor-map.js`。
- 地图使用官方 HTTPS 图片加载记录首页访问，不需要服务器、额外 Jekyll 插件或账号密钥。使用 eager 图片加载，即使访客未滚动到页面底部也会请求地图；不在 CV 等内页重复计数。本地直接预览也会计数，布局验证时已拦截地图请求并使用本地样本，避免反复测试增加统计。
- 所有本地资源使用 Jekyll `relative_url`，地图脚本沿用 CSS 的构建时间版本号。GitHub 构建检查会验证首页组件、HTTPS 地址、预留尺寸及发布脚本；关闭地图的构建同样受检查。
- [服务 FAQ](https://flagcounter.com/faq.html) 说明地图约五分钟更新，地理位置按访客 IP 判断；免费匿名计数器连续 30 天没有新增访客会被服务删除。初始少量访问可能来自服务创建和连接验证，数据不是此前的历史访问记录。

## 新布局与发布修复（2026-10-07）

- 使用宽版布局和本地 Lato 字体，正文 18px。首页集中展示简介、照片和学术链接，内页使用简短信息栏。学术数据、照片和原始 PDF 不变。
- 已复现新版 HTML 加载旧版 CSS 时正文缩进原 214px 侧栏的问题。新版改用独立的 `assets/css/academic-v2.css`，引用附带 Jekyll 构建时间版本参数。旧版 `academic.css` 保留，兼容浏览器仍缓存的旧页面。
- `.gitattributes` 统一文本文件为 LF，图片、PDF、字体按二进制保存。无需修改全局 Git 配置，也无需对整个仓库执行换行符重写。
- 字体随站点发布，许可证为 `assets/fonts/Lato-OFL.txt`；中文使用系统字体。
- 构建工作流在 Jekyll 生成之后运行 `node scripts/verify-academic-site.cjs _site`，检查五个页面、独立样式地址与版本、字体、照片及 CV 下载文件，防止遗漏资源。

## 可选补充信息

1. Google Scholar、ORCID 链接（如有）。
2. 是否需要注明博士申请意向、入学年份和目标方向。
3. 论文中三位作者后的 `*` 是否表示共同第一作者／同等贡献，以便添加准确的脚注。
4. Spaceland 的正式论文示意图（如希望在首页展示）。
5. 论文审稿状态、在研项目进展变化后，应同步更新网页与 PDF。

## 本地预览与发布

标准 Jekyll 预览（需安装 Ruby 与 Bundler）：

```sh
bundle install
bundle exec jekyll serve --host 127.0.0.1
```

访问 `http://127.0.0.1:4000`。正式校验命令为 `bundle exec jekyll build --strict_front_matter`。

仓库的 Jekyll 检查工作流已调整为在 main/master 推送、PR 或手动操作时运行。该工作流只检查构建，不负责开启 GitHub Pages。

当前修改保存在本地，未提交或推送。发布时将修改推送至自己的仓库，再检查 GitHub 仓库 Settings → Pages。若采用分支发布，选择实际使用的主分支和根目录。默认网址为 `https://xufangfang408.github.io/`。

本地如无 Ruby，可用 `local/site-preview/` 中的临时预览查看页面。它使用 Liquid 模板生成浏览器预览，不替代完整 Jekyll 构建。

运行中的临时预览可用 `node local/site-preview/preview.cjs --render` 刷新。正式验证应使用 Jekyll 生成的 `_site/`，再执行上面的资源检查；不要把临时预览目录作为发布源。

本次已完成真实 Jekyll 3.10.0／github-pages 232 的生产构建、`--strict_front_matter` 和 `--safe` 检查；生成页面的桌面与手机显示、资源及旧样式缓存回归检查均通过。独立验证环境保存在忽略的 `local/jekyll-runtime/`，可用 `& .\local\jekyll-runtime\build-site.ps1 --safe` 重复正式构建。当前本地浏览器预览已更新为实际 Jekyll 输出。

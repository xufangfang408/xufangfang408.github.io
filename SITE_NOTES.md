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
| 页面布局与视觉样式 | `_layouts/academic.html`、`assets/css/academic.css` |
| 公开照片、下载版 CV | `images/fangfang-xu.jpg`、`files/Fangfang-Xu-CV.pdf` |

模板示例文件仍保留在仓库中，但已在 `_config.yml` 中排除，不会作为个人成果发布。`local/` 同样不参与网站生成，且已被 Git 忽略。后续新增论文时，应更新学术数据和页面；不要直接启用模板示例集合。

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

# Bncr 插件说明

## 插件简介
Bncr 插件为 XXXBot 提供无界 API 消息推送能力，支持多种消息类型的自动转发。

## 目录结构
```
plugins/Bncr/
├── __init__.py
├── main.py
├── config.toml
└── README.md
```

## 依赖说明
- Python 3.10+
- loguru
- aiohttp
- filetype
- tomllib（Python 3.11+自带，3.10需pip安装tomli）

## 安装与使用
1. 将 Bncr 目录放入 plugins 目录下。
2. 安装依赖：
   ```bash
   pip install loguru aiohttp filetype tomli
   ```
3. 按需修改 config.toml 配置。
4. 启动或热加载插件。

## 无界适配器与上报地址说明

- 如需对接无界平台，请在无界市场安装 XYBotV2 适配器，或将 插件 项目中的 XYBotV2.js（或 xx.js）复制到无界适配器插件目录。
- 上报地址需与 xxxbot-pad 或 XYBotV2 后端服务保持一致：
  - xxxbot-pad 推荐上报地址：http://127.0.0.1:9011
  - XYBotV2 或 xxxBot 推荐上报地址：http://127.0.0.1:9090
- base_url 配置需与无界适配器上报地址一致，例如：
  - base_url = "http://127.0.0.1:8080/api/bot/XYBotV2"
  - 或 base_url = "http://127.0.0.1:8080/api/bot/xx"

### 基本配置（发送到无界）

```toml
[basic]
enable = true
base_url = "http://127.0.0.1:8080/api/bot/xx"
other-plugin-cmd = ["status", "bot", ...]
```
- enable: 是否启用插件
- base_url: 无界API推送地址（如需远程请自行修改）
- other-plugin-cmd: 支持的扩展命令

> 注意：无界适配器插件（如 XYBotV2.js）并不通用，请根据你的无界环境选择或定制合适的 js 文件，并确保上报地址与 base_url 保持一致。

## 支持的消息类型
- 文本（@on_text_message）
- @消息（@on_at_message）
- 图片（@on_image_message）
- 视频（@on_video_message）
- 文件（@on_file_message）
- 引用（@on_quote_message）
- 拍一拍（@on_pat_message）
- 语音（@on_voice_message）
- XML（@on_xml_message）
- 表情（@on_emoji_message）

## 版本更新记录
- 1.0.3：增加图片，视频消息，新增拍一拍回复指定内容，包括文本图片视频
- 1.0.2：支持所有官方文档消息类型，结构与异常处理优化
- 1.0.1：初始版本

## 最佳实践
- 所有消息处理均有 self.enable 判断
- 明确返回 True/False 控制消息阻塞
- 支持热插拔
- 详见 main.py 代码注释 
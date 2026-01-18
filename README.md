# 网页Steam双开 (Steam Multi-Login Manager)

[English](#english) | [中文](#中文)

---

<a name="中文"></a>
## 🇨🇳 中文说明

**网页Steam双开** 是一款专为 Firefox 设计的扩展，利用 Mozilla 原生容器技术（Contextual Identities）实现 Steam 网页端的多账号隔离与同时登录。

### ✨ 主要功能

* **🚀 真正的并行多开**：利用 Firefox 容器技术，为每个账号创建物理隔离的 Cookie 环境。
* **🛡️ 零凭证接触**：本扩展仅负责环境隔离，**绝不读取、记录或保存您的 Steam 账号密码**。
* **🔒 隐私锁**：支持设置本地 PIN 码/密码，防止他人窥探您的账号列表。
* **📝 智能备注**：支持超长文本备注（鼠标悬浮查看），方便记录余额、密钥、账号来源等信息。
* **🎨 原生体验**：精心设计的暗色 UI，完美契合 Steam 客户端风格。
* **👆 拖拽排序**：支持自由拖拽调整账号顺序。

### 📥 安装方法

1.  访问 **Firefox Add-ons 商店**：[点击这里下载](https://addons.mozilla.org/zh-CN/firefox/addon/%E7%BD%91%E9%A1%B5steam%E5%8F%8C%E5%BC%80/) 
2.  点击 "添加到 Firefox"。
3.  点击扩展图标，开始添加您的第一个账号容器。

### 🛠️ 开发与构建

如果您想审查代码或自行构建：

1.  克隆本仓库：
    ```bash
    git clone [https://github.com/GenmetsuWenxuePress/steam-multi-login.git](https://github.com/GenmetsuWenxuePress/steam-multi-login.git)
    ```
2.  打开 Firefox，地址栏输入 `about:debugging#/runtime/this-firefox`。
3.  点击 "临时载入附加组件..." (Load Temporary Add-on)。
4.  选择项目目录下的 `manifest.json` 文件。

### 📄 隐私与协议

* **隐私承诺**：所有数据（账号名、备注、设置）仅存储在您的本地浏览器 (`browser.storage.local`)，不上传至任何服务器。
* **许可证**：本项目基于 **Mozilla Public License 2.0** 开源。详情请参阅 [LICENSE](LICENSE) 文件。

---

<a name="english"></a>
## 🇺🇸 English Description

**Steam Multi-Login Manager** is a Firefox extension designed to manage multiple Steam accounts simultaneously using Mozilla's native **Contextual Identities** (Container) technology.

### ✨ Key Features

* **🚀 True Simultaneous Logins**: Physically isolated cookie jars for each account via Container technology.
* **🛡️ Zero Credential Access**: This extension **NEVER reads or saves your Steam username or password**. It only manages the isolation environment.
* **🔒 Privacy Lock**: Secure your account list with a local PIN/Password.
* **📝 Rich Notes**: Add detailed notes (e.g., wallet balance, keys) viewable via a scrollable tooltip.
* **🎨 Native Dark Theme**: UI designed to match the Steam client aesthetic.
* **👆 Drag & Drop**: Easily reorder your accounts.

### 📥 Installation

1.  Visit **Firefox Add-ons Store**: [Download Link](https://addons.mozilla.org/zh-CN/firefox/addon/%E7%BD%91%E9%A1%B5steam%E5%8F%8C%E5%BC%80/) 
2.  Click "Add to Firefox".

### 📜 License

This project is licensed under the **Mozilla Public License 2.0**.
See the [LICENSE](LICENSE) file for details.

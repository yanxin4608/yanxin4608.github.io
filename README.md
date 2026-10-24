# Xin Yan 严鑫 · 个人主页

纯静态网页：`index.html`（首页）、`photography.html`（摄影页）、`style.css`、`script.js`（暗色模式切换与滚动动画）、`fonts/`、`photos/`。
双击 `index.html` 就能在浏览器里本地预览。

## 用 GitHub Pages 免费上线

1. **注册 GitHub**：打开 github.com 注册。用户名会出现在网址里，例如用户名是 `xinyan`，网址就是 `https://xinyan.github.io`。
2. **新建仓库**：登录后点右上角 **+ → New repository**。
   - Repository name 必须填 `你的用户名.github.io`（完全一致，全小写）
   - 选 **Public**（免费账户的 Pages 需要公开仓库）
   - 点 **Create repository**
3. **上传文件**：在新仓库页面点 **uploading an existing file**（或 **Add file → Upload files**）。
   - 把本文件夹里的**所有内容**拖进去（是里面的文件和 `fonts`、`photos` 两个文件夹，不是外层文件夹本身）
   - `.nojekyll` 是隐藏文件，Mac 上在访达里按 **Cmd + Shift + .** 才能看到；不传也能正常显示
   - 页面底部点 **Commit changes**
4. **开启 Pages**：进入仓库 **Settings → Pages**。
   - Source 选 **Deploy from a branch**
   - Branch 选 **main**，文件夹选 **/ (root)**，点 **Save**
5. 等一两分钟，打开 `https://你的用户名.github.io` 就能看到网站。

**以后更新**：改好文件后，在仓库里再次 Upload files，同名文件会被覆盖，几分钟后网站自动更新。

## 可选：绑定自己的域名

1. 在域名商（如 Cloudflare、Namecheap、阿里云）买一个域名。
2. 在仓库 **Settings → Pages → Custom domain** 填入域名，保存。
3. 在域名商的 DNS 设置里添加一条 **CNAME** 记录，指向 `你的用户名.github.io`。
4. 生效后，回到 Pages 设置勾选 **Enforce HTTPS**。

## 还要补的内容

- `index.html` 的联系方式里，CV、LinkedIn、Instagram 的链接还被注释掉了。准备好后告诉 Claude，或者自己删掉注释符号 `<!--` 和 `-->` 并填上网址。
- 如果要放 CV，请用**不含电话号码和证书编号**的版本，另存为 `cv.pdf` 放在本文件夹根目录。
- 摄影页的开头一句 “Photographs from places along the way.” 可以换成你自己的话。

## 关于在中国大陆访问

字体已经放在本地，不依赖 Google Fonts；中文用系统自带字体（苹方、微软雅黑等）。
GitHub Pages 在大陆的访问速度和稳定性不保证。建议投递国内岗位时，简历里同时附上 PDF。

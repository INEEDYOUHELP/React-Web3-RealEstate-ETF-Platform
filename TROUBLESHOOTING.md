# IPFS/Pinata 配置问题排查

## 问题：Pinata 未配置错误

如果看到错误信息：
```
IPFS 错误: Pinata 未配置。请在 .env.local 中设置 NEXT_PUBLIC_PINATA_API_KEY 和 NEXT_PUBLIC_PINATA_SECRET_KEY
```

## 解决方案

### 步骤 1: 确认 .env.local 文件存在

在**项目根目录**（与 `package.json` 同级）确认 `.env.local` 文件存在，内容如下：

```bash
NEXT_PUBLIC_PINATA_API_KEY=9efa6ccb04a87a5f9994
NEXT_PUBLIC_PINATA_SECRET_KEY=0a7ec948e107c32b00172818fa386708eddd92d967d3ef6f2cf1e30283022cc1
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

**重要提示**：
- 文件必须在**项目根目录**，不是 `src/hardhat/.env`
- 变量名必须以 `NEXT_PUBLIC_` 开头（Next.js 要求）
- 不要有多余的空格或引号

### 步骤 2: 重启 Next.js 开发服务器

**这是最关键的步骤！** Next.js 只在启动时读取环境变量。

1. **停止当前的开发服务器**（在运行 `npm run dev` 的终端按 `Ctrl+C`）
2. **重新启动**：
   ```bash
   npm run dev
   ```
3. **刷新浏览器页面**（按 `F5` 或 `Ctrl+R`）

### 步骤 3: 检查浏览器控制台

打开浏览器开发者工具（F12），在控制台中查看是否有调试信息：

```
Pinata 配置检查: {
  hasApiKey: true,
  hasSecretKey: true,
  ...
}
```

如果看到 `hasApiKey: false` 或 `hasSecretKey: false`，说明环境变量仍未加载。

### 步骤 4: 验证环境变量格式

确保 `.env.local` 文件格式正确：

✅ **正确格式**：
```bash
NEXT_PUBLIC_PINATA_API_KEY=9efa6ccb04a87a5f9994
NEXT_PUBLIC_PINATA_SECRET_KEY=0a7ec948e107c32b00172818fa386708eddd92d967d3ef6f2cf1e30283022cc1
```

❌ **错误格式**（不要这样做）：
```bash
NEXT_PUBLIC_PINATA_API_KEY="9efa6ccb04a87a5f9994"  # 不要加引号
NEXT_PUBLIC_PINATA_API_KEY = 9efa6ccb04a87a5f9994  # 不要有空格
```

### 步骤 5: 清除 Next.js 缓存（如果仍然不行）

如果重启后仍然有问题，尝试清除 Next.js 缓存：

```bash
# 停止开发服务器
# 删除 .next 目录
rm -rf .next
# 或者在 Windows 上：
rmdir /s .next

# 重新启动
npm run dev
```

### 步骤 6: 检查文件位置

确保 `.env.local` 文件在正确的位置：

```
毕业项目/
├── .env.local          ← 应该在这里（项目根目录）
├── package.json
├── src/
│   ├── hardhat/
│   │   └── .env        ← 这是 Hardhat 的配置，不是前端的
│   └── ...
```

### 常见问题

**Q: 我已经创建了 .env.local，为什么还是报错？**
A: 必须重启 Next.js 开发服务器才能加载新的环境变量。

**Q: 环境变量在服务端能读取，但在客户端读取不到？**
A: 确保变量名以 `NEXT_PUBLIC_` 开头，这是 Next.js 的要求。

**Q: 我修改了 .env.local，需要重启吗？**
A: 是的，每次修改 `.env.local` 后都需要重启开发服务器。

**Q: 生产环境怎么办？**
A: 在生产环境（如 Vercel、Netlify），需要在平台的环境变量设置中添加这些变量，而不是使用 `.env.local` 文件。

## 快速检查清单

- [ ] `.env.local` 文件在项目根目录
- [ ] 变量名以 `NEXT_PUBLIC_` 开头
- [ ] 没有多余的空格或引号
- [ ] 已重启 Next.js 开发服务器
- [ ] 已刷新浏览器页面
- [ ] 浏览器控制台没有其他错误

如果完成以上步骤后仍有问题，请检查：
1. Pinata API Key 和 Secret Key 是否有效
2. 网络连接是否正常
3. 浏览器控制台的完整错误信息


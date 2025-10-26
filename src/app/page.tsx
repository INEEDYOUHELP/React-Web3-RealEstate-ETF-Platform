import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// app/page.tsx
export default function HomePage() {
  return (
    <div>
      <h1>欢迎来到我的毕业项目主页！</h1>
      <p>这里是 Next.js 13+ app 路由的首页示例。</p>
      <ConnectButton />
    </div>
  );
}
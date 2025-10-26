import React from 'react';
// 添加 Providers 导入
import { Providers } from './components/wallet/WalletProvider';

export default function RootLayout({ children }) {
    return (
        <html lang="zh">
          <head>
            <title>我的网站</title>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body>
            <header>
              <nav>
                <a href="/">首页</a> | <a href="/about">关于</a>
              </nav>
            </header>
            <main>          
              <Providers>
                {children}
              </Providers>
            </main>
            <footer>
              <p>© 2025 我的毕业项目</p>
            </footer>
          </body>
        </html>
      );
}
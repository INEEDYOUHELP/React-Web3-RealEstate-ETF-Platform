import React from 'react';
import { Providers } from './components/wallet/WalletProvider';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import '@rainbow-me/rainbowkit/styles.css';
import '../styles/globals.css';
import '../styles/components.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <title>基于React与Web3的房地产平台 - 毕业项目</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="基于Web3技术的去中心化房地产平台，让您轻松管理房地产资产和代币化交易" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <Navbar />
          <main style={{ paddingTop: '70px', minHeight: 'calc(100vh - 70px)' }}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

// 样式定义
const bodyStyles: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  lineHeight: 1.6,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
};

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
};

const headerStyles: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  backdropFilter: 'blur(10px)',
};

const navStyles: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '72px',
  gap: '24px',
};

const navLeftStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
};

const logoStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  textDecoration: 'none',
  color: '#0f172a',
  fontWeight: 700,
  fontSize: '20px',
  transition: 'opacity 0.2s',
};

const logoIconStyles: React.CSSProperties = {
  fontSize: '28px',
};

const logoTextStyles: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const navCenterStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '32px',
  flex: 1,
  justifyContent: 'center',
};

const navLinkStyles: React.CSSProperties = {
  color: '#475569',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: '15px',
  padding: '8px 12px',
  borderRadius: '8px',
  transition: 'all 0.2s',
  position: 'relative',
};

const navRightStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
};

const mainStyles: React.CSSProperties = {
  flex: 1,
  width: '100%',
};

const footerStyles: React.CSSProperties = {
  backgroundColor: '#0f172a',
  color: '#cbd5e1',
  marginTop: '80px',
  borderTop: '1px solid #1e293b',
};

const footerContentStyles: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '64px 24px 32px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '40px',
};

const footerSectionStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const footerTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#ffffff',
  margin: 0,
  marginBottom: '8px',
};

const footerTextStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#94a3b8',
  lineHeight: 1.6,
  margin: 0,
};

const footerListStyles: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const footerLinkStyles: React.CSSProperties = {
  color: '#94a3b8',
  textDecoration: 'none',
  fontSize: '14px',
  transition: 'color 0.2s',
};

const chainBadgeStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  backgroundColor: 'rgba(67, 56, 202, 0.1)',
  border: '1px solid rgba(67, 56, 202, 0.3)',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#a5b4fc',
  marginTop: '8px',
  width: 'fit-content',
};

const chainIconStyles: React.CSSProperties = {
  fontSize: '16px',
};

const footerBottomStyles: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '24px',
  borderTop: '1px solid #1e293b',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
};

const footerCopyrightStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#64748b',
  margin: 0,
};

const footerLegalStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '14px',
};

const footerSeparatorStyles: React.CSSProperties = {
  color: '#475569',
};
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.footerLogo}>
              <i className="fas fa-building"></i>
              <span>RealEstate ETF</span>
            </div>
            <p>基于Web3技术的去中心化房地产投资平台，让投资更简单、更透明、更安全。</p>
            <div className={styles.socialLinks}>
              <a href="#" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" aria-label="Telegram">
                <i className="fab fa-telegram"></i>
              </a>
              <a href="#" aria-label="Discord">
                <i className="fab fa-discord"></i>
              </a>
              <a href="#" aria-label="GitHub">
                <i className="fab fa-github"></i>
              </a>
            </div>
          </div>
          
          <div className={styles.footerSection}>
            <h4>产品</h4>
            <ul>
              <li><Link href="/assets">资产展示</Link></li>
              <li><Link href="/portfolio">投资组合</Link></li>
              <li><Link href="/trading">交易中心</Link></li>
              <li><Link href="/analytics">数据分析</Link></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h4>支持</h4>
            <ul>
              <li><a href="#">帮助中心</a></li>
              <li><a href="#">API文档</a></li>
              <li><a href="#">联系我们</a></li>
              <li><a href="#">隐私政策</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h4>订阅</h4>
            <p>获取最新的市场动态和投资机会</p>
            <div className={styles.newsletter}>
              <input type="email" placeholder="输入邮箱地址" />
              <button className="btn btn-primary">订阅</button>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; 2024 房地产ETF资产选择平台. 基于React与Web3技术构建.</p>
        </div>
      </div>
    </footer>
  );
}


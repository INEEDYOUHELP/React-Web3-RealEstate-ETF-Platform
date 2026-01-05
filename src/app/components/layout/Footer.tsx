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
              <span>房地产平台</span>
            </div>
            <p>基于Web3技术的去中心化房地产平台，让资产管理更简单、更透明、更安全。</p>
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
              <li><Link href="/issuance">份额发行</Link></li>
              <li><Link href="/transfer">份额转账</Link></li>
              <li><Link href="/distribution">收益分配</Link></li>
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
          <p>&copy; 2024 基于React与Web3的房地产平台. 基于React与Web3技术构建.</p>
        </div>
      </div>
    </footer>
  );
}


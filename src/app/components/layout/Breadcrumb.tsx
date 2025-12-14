import Link from 'next/link';
import styles from './Breadcrumb.module.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className={styles.breadcrumb}>
      {items.map((item, index) => (
        <span key={index} className={styles.breadcrumbItem}>
          {item.href && index < items.length - 1 ? (
            <>
              <Link href={item.href} className={styles.breadcrumbLink}>
                {item.label}
              </Link>
              <span className={styles.separator}>/</span>
            </>
          ) : (
            <span className={styles.active}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}


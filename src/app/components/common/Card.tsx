import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, actions, children, className = '' }: CardProps) {
  return (
    <div className={`${styles.card} ${className}`}>
      {(title || actions) && (
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <div>{actions}</div>
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
}


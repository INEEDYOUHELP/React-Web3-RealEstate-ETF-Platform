import React from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
  message?: string;
}

export default function Loading({ message = '加载中...' }: LoadingProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} />
      <span>{message}</span>
    </div>
  );
}


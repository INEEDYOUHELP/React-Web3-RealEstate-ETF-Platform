import styles from './TradingPanel.module.css';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function TradingPanel({ children }: Props) {
  return <div className={styles.grid}>{children}</div>;
}


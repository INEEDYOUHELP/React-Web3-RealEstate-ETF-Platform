'use client';

import React from 'react';
import styles from './Notification.module.css';

type Type = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  type?: Type;
  message: string;
  onClose?: () => void;
}

export default function Notification({ type = 'info', message, onClose }: NotificationProps) {
  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button className={styles.close} onClick={onClose}>
          <i className="fas fa-times" />
        </button>
      )}
    </div>
  );
}


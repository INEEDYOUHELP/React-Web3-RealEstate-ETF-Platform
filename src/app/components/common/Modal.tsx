'use client';

import React from 'react';
import Button from './Button';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>{title}</div>
          <Button variant="ghost" onClick={onClose} aria-label="关闭">
            <i className="fas fa-times" />
          </Button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}


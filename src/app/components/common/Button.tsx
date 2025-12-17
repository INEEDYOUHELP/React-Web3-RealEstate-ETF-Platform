'use client';

import React from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: React.ReactNode;
}

export default function Button({ variant = 'primary', icon, children, className = '', ...rest }: ButtonProps) {
  return (
    <button className={`${styles.button} ${styles[variant]} ${className}`} {...rest}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}


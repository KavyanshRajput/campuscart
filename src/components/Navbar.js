"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Plus, LogOut, User, Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`${styles.navContent} container`}>
        <Link href="/" className={styles.logo}>
          <ShoppingCart className={styles.logoIcon} size={28} />
          <span>Campus<span className="gradient-text">Cart</span></span>
        </Link>

        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/explore" className={styles.navLink}>Explore</Link>
          <Link href="/sell" className={styles.navLink}>Sell</Link>
        </div>

        <div className={styles.navActions}>
          {user ? (
            <div className={styles.userProfile}>
              <Link href="/profile" className={styles.userName}>{user.displayName.split(' ')[0]}</Link>
              <Link href="/profile" className={styles.avatar}>
                {user.photoURL ? (
                  <Image src={user.photoURL} alt="Profile" width={32} height={32} className={styles.avatarImg} />
                ) : (
                  <User size={20} />
                )}
              </Link>
              <button onClick={logout} className={styles.logoutBtn} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={loginWithGoogle} className={styles.loginBtn}>
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

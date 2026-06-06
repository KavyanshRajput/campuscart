"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Plus, LogOut, User, Home, Compass, MessageCircle, Heart } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* Desktop Header Navbar */}
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} glass-effect`}>
        <div className={`${styles.navContent} container`}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.png" alt="CampusCart Logo" width={30} height={30} className={styles.logoImg} />
            <span>Campus<span className={styles.brandGrad}>Cart</span></span>
          </Link>

          <div className={styles.navLinks}>
            <Link href="/" className={`${styles.navLink} ${isActive('/') ? styles.activeLink : ''}`}>
              Home
            </Link>
            <Link href="/explore" className={`${styles.navLink} ${isActive('/explore') ? styles.activeLink : ''}`}>
              Explore
            </Link>
            <Link href="/sell" className={`${styles.navLink} ${isActive('/sell') ? styles.activeLink : ''}`}>
              Sell Item
            </Link>
          </div>

          <div className={styles.navActions}>
            {user ? (
              <div className={styles.userProfile}>
                <Link href="/profile" className={styles.userName}>
                  {user.displayName?.split(' ')[0] || 'Student'}
                </Link>
                <Link href="/profile" className={styles.avatar}>
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt="Profile" width={28} height={28} className={styles.avatarImg} />
                  ) : (
                    <User size={18} />
                  )}
                </Link>
                <button onClick={logout} className={styles.logoutBtn} title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={loginWithGoogle} className={styles.loginBtn}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Floating Bottom Dock Navigation */}
      <div className={styles.mobileDockContainer}>
        <div className={`${styles.mobileDock} glass-effect`}>
          <Link href="/" className={`${styles.dockItem} ${isActive('/') ? styles.dockItemActive : ''}`}>
            <Home size={22} />
            <span>Home</span>
          </Link>
          <Link href="/profile?tab=chat" className={`${styles.dockItem} ${pathname.includes('profile') && pathname.includes('tab=chat') ? styles.dockItemActive : ''}`}>
            <MessageCircle size={22} />
            <span>Chat</span>
          </Link>
          
          <div className={styles.fabWrapper}>
            <Link href="/sell" className={styles.fabBtn} title="Sell Item">
              <Plus size={28} />
            </Link>
          </div>
          
          <Link href="/explore" className={`${styles.dockItem} ${isActive('/explore') ? styles.dockItemActive : ''}`}>
            <Compass size={22} />
            <span>Explore</span>
          </Link>
          <Link href="/profile" className={`${styles.dockItem} ${isActive('/profile') && !pathname.includes('tab=chat') ? styles.dockItemActive : ''}`}>
            <User size={22} />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </>
  );
}

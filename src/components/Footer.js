"use client";

import Link from 'next/link';
import { ShoppingCart, Mail, Phone, MapPin, User, ShieldCheck } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`${styles.footerContent} container`}>
        {/* Left Column: Branding and Intro */}
        <div className={styles.brandSection}>
          <Link href="/" className={styles.logo}>
            <ShoppingCart className={styles.logoIcon} size={24} />
            <span>Campus<span className={styles.brandGrad}>Cart</span></span>
          </Link>
          <p className={styles.description}>
            The exclusive student-to-student marketplace for Acropolis Institute. Buy, sell, and rent items within your campus community safely and easily.
          </p>
          <div className={styles.securityBadge}>
            <ShieldCheck size={16} className={styles.shieldIcon} />
            <span>Student Verified Accounts</span>
          </div>
        </div>

        {/* Middle Column: Fast Navigation Links */}
        <div className={styles.linksSection}>
          <h4 className={styles.sectionTitle}>Quick Links</h4>
          <ul className={styles.linksList}>
            <li><Link href="/">Home Page</Link></li>
            <li><Link href="/explore">Explore Listings</Link></li>
            <li><Link href="/sell">List an Item</Link></li>
            <li><Link href="/profile">My Profile</Link></li>
          </ul>
        </div>

        {/* Right Column: Developer Credit Card */}
        <div className={styles.developerCardWrapper}>
          <div className={styles.developerCard}>
            <div className={styles.cardHeader}>
              <div className={styles.devIconWrapper}>
                <User size={18} />
              </div>
              <div>
                <h4 className={styles.developerName}>Kavyansh Singh Rajput</h4>
              </div>
            </div>
            
            <div className={styles.cardBody}>
              <a href="mailto:kavyanshrajput230530@acropolis.in" className={styles.contactItem}>
                <Mail size={14} />
                <span>kavyanshrajput230530@acropolis.in</span>
              </a>
              <a href="tel:8839988997" className={styles.contactItem}>
                <Phone size={14} />
                <span>+91 88399 88997</span>
              </a>
              <div className={styles.contactItem}>
                <MapPin size={14} />
                <span>Indore, India</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Area */}
      <div className={styles.footerBottom}>
        <div className={`${styles.bottomContent} container`}>
          <p className={styles.copyright}>
            &copy; {currentYear} CampusCart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { ShoppingBag, Zap, Shield, Users, ArrowRight, Book, Laptop, Shirt, Home as HomeIcon, Trophy, Heart } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

const CATEGORIES = [
  { name: 'Books', icon: <Book size={24} />, color: '#4f46e5' },
  { name: 'Electronics', icon: <Laptop size={24} />, color: '#10b981' },
  { name: 'Fashion', icon: <Shirt size={24} />, color: '#f59e0b' },
  { name: 'Home', icon: <HomeIcon size={24} />, color: '#ec4899' },
  { name: 'Sports', icon: <Trophy size={24} />, color: '#8b5cf6' },
  { name: 'Other', icon: <Heart size={24} />, color: '#64748b' },
];

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [error, setError] = useState('');

  useEffect(() => {
    let q = query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(8));
    
    if (activeCategory !== 'All') {
      q = query(
        collection(db, "listings"), 
        where("category", "==", activeCategory.toLowerCase()),
        orderBy("createdAt", "desc"),
        limit(8)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setListings(data);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Query Error:", err);
      if (err.code === 'failed-precondition') {
        setActiveCategory('All');
        setError('Database indexing in progress. Showing all items for now.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeCategory]);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`${styles.heroContent} container`}>
          <div className={styles.badge}>AcroCart: Exclusive for Students</div>
          <h1 className={styles.heroTitle}>
            The Smartest Way to <span className="gradient-text">Buy & Sell</span> on Campus
          </h1>
          <p className={styles.heroSubtitle}>
            Join thousands of Acropolis students trading textbooks, gadgets, and more. 
            Safe, fast, and exclusive to your college community.
          </p>
          <div className={styles.heroActions}>
            <Link href="/explore" className={styles.primaryBtn}>
              Start Browsing <ArrowRight size={20} />
            </Link>
            <Link href="/sell" className={styles.secondaryBtn}>
              List an Item
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className={styles.trustSection}>
        <div className={`${styles.trustGrid} container`}>
          <div className={styles.trustItem}>
            <div className={styles.trustIcon}><Shield size={20} /></div>
            <div>
              <h4>Verified Only</h4>
              <p>Exclusive access for @acropolis.in accounts</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <div className={styles.trustIcon}><Zap size={20} /></div>
            <div>
              <h4>Instant Deals</h4>
              <p>Meet and trade safely right on campus</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <div className={styles.trustIcon}><Users size={20} /></div>
            <div>
              <h4>Trust Based</h4>
              <p>Build your reputation within the community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={`${styles.categories} container`}>
        <div className={styles.sectionHeader}>
          <h2>Browse by Category</h2>
          <p>Everything you need for a successful semester.</p>
        </div>
        <div className={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.name} 
              className={`${styles.categoryCard} ${activeCategory === cat.name ? styles.activeCategory : ''}`}
              onClick={() => setActiveCategory(activeCategory === cat.name ? 'All' : cat.name)}
              style={{ '--cat-color': cat.color }}
            >
              <div className={styles.iconCircle}>{cat.icon}</div>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className={`${styles.featured} container`}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerFlex}>
            <h2>{activeCategory === 'All' ? 'Recently Added' : `Top in ${activeCategory}`}</h2>
            <Link href="/explore" className={styles.viewAll}>Explore All <ArrowRight size={18} /></Link>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3, 4].map(i => <div key={i} className={styles.skeletonCard}></div>)}
          </div>
        ) : listings.length > 0 ? (
          <div className={styles.productGrid}>
            {listings.map(item => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ShoppingBag size={40} />
            </div>
            <h3>No items listed yet</h3>
            <p>Be the first to list something in this category!</p>
            <Link href="/sell" className={styles.primaryBtn} style={{ marginTop: '10px' }}>Post an Ad</Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`${styles.footerContent} container`}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <ShoppingBag className={styles.logoIcon} size={24} />
              <span>Campus<span className="gradient-text">Cart</span></span>
            </div>
            <p>Empowering student commerce at Acropolis Institute of Technology and Research. Safe, simple, and student-first.</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h4>Marketplace</h4>
              <Link href="/explore">All Categories</Link>
              <Link href="/explore?cat=books">Textbooks</Link>
              <Link href="/explore?cat=electronics">Electronics</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4>Company</h4>
              <Link href="/about">About Us</Link>
              <Link href="/terms">Terms of Use</Link>
              <Link href="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2024 CampusCart Marketplace • A Minor Project Initiative</p>
        </div>
      </footer>
    </div>
  );
}


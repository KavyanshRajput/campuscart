"use client";

import { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { Search, SlidersHorizontal, Grid, List as ListIcon, ShoppingBag, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import styles from './explore.module.css';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Fashion', 'Home', 'Sports', 'Other'];

function ExploreContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('grid');

  useEffect(() => {
    if (catParam) {
      const matched = CATEGORIES.find(c => c.toLowerCase() === catParam.toLowerCase());
      if (matched) setActiveCategory(matched);
    }
  }, [catParam]);

  useEffect(() => {
    let q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    
    if (activeCategory !== 'All') {
      q = query(
        collection(db, "listings"), 
        where("category", "==", activeCategory.toLowerCase()),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setListings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeCategory]);

  const filteredListings = listings.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Explore <span className="gradient-text">Campus Finds</span></h1>
          <p>Discover unique items from your fellow students.</p>
        </div>

        <div className={styles.searchBarWrapper}>
          <div className={styles.searchBar}>
            <Search size={20} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search for books, calculators, gadgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.filterBtn}>
            <SlidersHorizontal size={20} />
            <span>Filters</span>
          </button>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.categoryTabs}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`${styles.tab} ${activeCategory === cat ? styles.activeTab : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.viewToggle}>
          <button 
            onClick={() => setViewType('grid')}
            className={viewType === 'grid' ? styles.activeView : ''}
          >
            <Grid size={18} />
          </button>
          <button 
            onClick={() => setViewType('list')}
            className={viewType === 'list' ? styles.activeView : ''}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={styles.skeletonCard}></div>)}
        </div>
      ) : filteredListings.length > 0 ? (
        <div className={viewType === 'grid' ? styles.productGrid : styles.productList}>
          {filteredListings.map(item => (
            <ProductCard key={item.id} item={item} variant={viewType} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <ShoppingBag size={48} />
          </div>
          <h3>No items match your search</h3>
          <p>Try different keywords or browse all categories.</p>
          <button 
            onClick={() => {setSearchQuery(''); setActiveCategory('All');}} 
            className={styles.resetBtn}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div>Loading marketplace...</div>}>
      <ExploreContent />
    </Suspense>
  );
}

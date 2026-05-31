"use client";

import { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Search, SlidersHorizontal, Grid, List as ListIcon, ShoppingBag, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import styles from './explore.module.css';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Fashion', 'Home', 'Sports', 'Other'];

const TRENDING_KEYWORDS = ['HC Verma', 'Lab Coat', 'FX-991EX', 'Drafter', 'Cycles', 'Kettle'];

function ExploreContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');
  const searchParam = searchParams.get('search');
  
  const [activeCategory, setActiveCategory] = useState(() => {
    if (catParam) {
      const matched = CATEGORIES.find(c => c.toLowerCase() === catParam.toLowerCase());
      if (matched) return matched;
    }
    return 'All';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParam ? decodeURIComponent(searchParam) : '';
  });
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('grid');

  // Sidebar Filter States
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedAges, setSelectedAges] = useState([]);

  useEffect(() => {
    // Robust Firestore listener with client-side fallback
    const listingsRef = collection(db, "listings");
    const q = query(listingsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setListings(data);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Loading Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAgeToggle = (ageVal) => {
    setSelectedAges(prev => 
      prev.includes(ageVal) ? prev.filter(a => a !== ageVal) : [...prev, ageVal]
    );
  };

  // Filter listings client side based on category, search input, price range, and usage age
  const filteredListings = listings.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category?.toLowerCase() === activeCategory.toLowerCase();
    
    const matchesSearch = searchQuery.trim() === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPrice = (item.price || 0) <= maxPrice;

    const matchesAge = selectedAges.length === 0 || (() => {
      const ageStr = (item.age || '').toLowerCase();
      return selectedAges.some(ageVal => {
        if (ageVal === 'new') {
          return ageStr.includes('new') || ageStr.includes('month') || ageStr.includes('semester');
        }
        if (ageVal === 'medium') {
          return ageStr.includes('year') && !ageStr.includes('2') && !ageStr.includes('3');
        }
        if (ageVal === 'old') {
          return ageStr.includes('2') || ageStr.includes('3') || ageStr.includes('years') || ageStr.includes('old');
        }
        return false;
      });
    })();
      
    return matchesCategory && matchesSearch && matchesPrice && matchesAge;
  });

  return (
    <div className={`${styles.page} container animate-fade-up`}>
      <div className={styles.exploreGrid}>
        {/* Left Sidebar Filter Card (Desktop Viewport Only) */}
        <aside className={styles.filterSidebar}>
          <div className={styles.sidebarCard}>
            <h4 className={styles.sidebarTitle}>
              <SlidersHorizontal size={16} className={styles.sidebarTitleIcon} />
              Filter Results
            </h4>
            
            {/* Price Filter */}
            <div className={styles.filterSection}>
              <h5 className={styles.filterLabel}>Max Price: <span className={styles.priceHighlight}>₹{maxPrice}</span></h5>
              <input 
                type="range" 
                min="0" 
                max="10000" 
                step="100"
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className={styles.priceRangeInput}
              />
              <div className={styles.rangeLabels}>
                <span>₹0</span>
                <span>₹10,000+</span>
              </div>
            </div>

            {/* Age / Usage Filter */}
            <div className={styles.filterSection}>
              <h5 className={styles.filterLabel}>Item Usage Age</h5>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={selectedAges.includes('new')}
                    onChange={() => handleAgeToggle('new')}
                  />
                  <span>New &bull; under 1 sem</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={selectedAges.includes('medium')}
                    onChange={() => handleAgeToggle('medium')}
                  />
                  <span>Used &bull; under 1 year</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={selectedAges.includes('old')}
                    onChange={() => handleAgeToggle('old')}
                  />
                  <span>Old &bull; over 1 year</span>
                </label>
              </div>
            </div>

            {/* Trending Keywords */}
            <div className={styles.filterSection}>
              <h5 className={styles.filterLabel}>Trending Searches</h5>
              <div className={styles.keywordGrid}>
                {TRENDING_KEYWORDS.map(word => (
                  <button 
                    key={word}
                    onClick={() => setSearchQuery(word)}
                    className={`${styles.keywordBadge} ${searchQuery.toLowerCase() === word.toLowerCase() ? styles.activeKeyword : ''}`}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button 
              onClick={() => {
                setMaxPrice(5000);
                setSelectedAges([]);
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className={styles.sidebarResetBtn}
            >
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Right Main Feed Grid */}
        <div className={styles.mainFeedGrid}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <h1>Explore <span className="gradient-text">Campus Finds</span></h1>
              <p>Discover unique items from your fellow students.</p>
            </div>

            <div className={styles.searchBarWrapper}>
              <div className={styles.searchBar}>
                <Search size={18} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search for books, calculators, gadgets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => {
                  setMaxPrice(5000);
                  setSelectedAges([]);
                }}
                className={styles.filterBtn}
                title="Reset pricing/age filters"
              >
                <SlidersHorizontal size={18} />
                <span>Reset</span>
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
                title="Grid View"
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setViewType('list')}
                className={viewType === 'list' ? styles.activeView : ''}
                title="List View"
              >
                <ListIcon size={16} />
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
                <ShoppingBag size={32} />
              </div>
              <h3>No items match your search</h3>
              <p>Try adjusting your filters, modifying search keywords, or selecting a different category.</p>
              <button 
                onClick={() => {
                  setSearchQuery(''); 
                  setActiveCategory('All');
                  setMaxPrice(5000);
                  setSelectedAges([]);
                }} 
                className={styles.resetBtn}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0' }}>Loading marketplace...</div>}>
      <ExploreContent />
    </Suspense>
  );
}

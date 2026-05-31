"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Heart, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './ProductCard.module.css';

export default function ProductCard({ item, variant = 'grid' }) {
  const { id, title, price, age, category, images, status } = item;
  const [isFav, setIsFav] = useState(() => {
    if (typeof window !== 'undefined') {
      const favs = JSON.parse(localStorage.getItem('savedItems') || '[]');
      return favs.includes(id);
    }
    return false;
  });

  useEffect(() => {
    // Listen to changes from other components (like detail page or other cards)
    const handleFavSync = () => {
      const updatedFavs = JSON.parse(localStorage.getItem('savedItems') || '[]');
      setIsFav(updatedFavs.includes(id));
    };

    window.addEventListener('favoritesChanged', handleFavSync);
    return () => window.removeEventListener('favoritesChanged', handleFavSync);
  }, [id]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favs = JSON.parse(localStorage.getItem('savedItems') || '[]');
    let updated;
    if (favs.includes(id)) {
      updated = favs.filter(x => x !== id);
      setIsFav(false);
    } else {
      updated = [...favs, id];
      setIsFav(true);
    }
    localStorage.setItem('savedItems', JSON.stringify(updated));
    window.dispatchEvent(new Event('favoritesChanged'));
  };

  const isSold = status === 'sold';

  return (
    <Link href={`/listing?id=${id}`} className={`${styles.card} ${styles[variant]} ${isSold ? styles.soldCard : ''}`}>
      <div className={styles.imageWrapper}>
        <Image 
          src={images?.[0] || 'https://via.placeholder.com/400x400?text=Product'} 
          alt={title} 
          className={styles.image}
          fill
          sizes={variant === 'grid' ? "(max-width: 768px) 50vw, 33vw" : "150px"}
        />
        
        {/* Category Badge */}
        <div className={styles.categoryBadge}>{category}</div>

        {/* Favorite Heart Button */}
        <button 
          className={`${styles.favBtn} ${isFav ? styles.isFav : ''}`}
          onClick={toggleFavorite}
          title={isFav ? "Remove from Saved" : "Save Item"}
        >
          <Heart size={16} fill={isFav ? "currentColor" : "none"} />
        </button>

        {/* Sold Overlay */}
        {isSold && (
          <div className={styles.soldOverlay}>
            <div className={styles.soldBadge}>
              <CheckCircle2 size={16} />
              <span>SOLD</span>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <Clock size={12} />
            <span>{age || 'New'}</span>
          </div>
          <div className={styles.price}>₹{price}</div>
        </div>
        
        <div className={styles.viewBtn}>
          <span>View Details</span>
          <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  );
}

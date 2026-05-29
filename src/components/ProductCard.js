import Link from 'next/link';
import Image from 'next/image';
import { Clock, ShoppingBag, ArrowRight } from 'lucide-react';
import styles from './ProductCard.module.css';

export default function ProductCard({ item, variant = 'grid' }) {
  const { id, title, price, age, category, images } = item;
  
  return (
    <Link href={`/listing?id=${id}`} className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.imageWrapper}>
        <Image 
          src={images?.[0] || 'https://via.placeholder.com/400x400?text=Product'} 
          alt={title} 
          className={styles.image}
          fill
          sizes={variant === 'grid' ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : "200px"}
        />
        <div className={styles.categoryBadge}>{category}</div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <Clock size={14} />
            <span>{age || 'New'}</span>
          </div>
          <div className={styles.price}>₹{price}</div>
        </div>
        
        <div className={styles.viewBtn}>
          View Details <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}

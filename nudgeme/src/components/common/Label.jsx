export default function Label({ children, className = '' }) {
  return (
    <div className={`text-xs uppercase tracking-widest text-muted ${className}`}>
      {children}
    </div>
  );
}


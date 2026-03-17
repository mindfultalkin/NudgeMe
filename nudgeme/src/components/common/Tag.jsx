export default function Tag({ 
  children, 
  variant = 'default',
  className = '' 
}) {
  const variants = {
    default: 'bg-gray-100 text-muted',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-50 text-success',
    danger: 'bg-red-50 text-warning',
    dark: 'bg-primary-dark text-primary-light',
  };
  
  return (
    <span 
      className={`inline-block px-2 py-0.5 text-xs uppercase tracking-widest rounded-sm ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}


export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  ...props 
}) {
  const baseStyles = 'font-serif uppercase tracking-widest cursor-pointer transition-all duration-200 rounded-sm';
  
  const variants = {
    primary: 'bg-primary-dark text-primary-light hover:opacity-90',
    secondary: 'bg-primary text-primary-dark hover:opacity-90',
    success: 'bg-success text-white hover:opacity-90',
    danger: 'bg-warning text-white border border-red-200',
    ghost: 'bg-transparent border border-border text-muted hover:bg-gray-100',
    dark: 'bg-primary-dark text-primary-light',
    light: 'bg-gray-100 text-gray-600',
    outline: 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50',
  };
  
  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}


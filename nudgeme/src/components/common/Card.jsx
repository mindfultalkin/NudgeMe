export default function Card({ children, className = '', style = {}, ...props }) {
  return (
    <div 
      className={`bg-white border border-border rounded-sm p-5 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}


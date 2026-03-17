export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 text-sm border border-border rounded-sm outline-none focus:border-primary transition-colors ${className}`}
      {...props}
    />
  );
}


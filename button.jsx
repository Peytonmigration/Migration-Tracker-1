export function Button({ children, className='', variant='default', ...props }) {
  const base = 'btn';
  const v = variant === 'secondary' ? '' : (variant === 'destructive' ? ' bg-red-600 text-white hover:bg-red-700' : ' primary');
  return <button className={`${base} ${v} ${className}`} {...props}>{children}</button>;
}

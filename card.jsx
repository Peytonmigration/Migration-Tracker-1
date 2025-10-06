export function Card({ children, className='' }){ return <div className={`card ${className}`}>{children}</div> }
export function CardHeader({ children, className='' }){ return <div className={`card-header ${className}`}>{children}</div> }
export function CardTitle({ children, className='' }){ return <div className={`card-title ${className}`}>{children}</div> }
export function CardDescription({ children, className='' }){ return <div className={`card-description ${className}`}>{children}</div> }
export function CardContent({ children, className='' }){ return <div className={`card-content ${className}`}>{children}</div> }
export function CardFooter({ children, className='' }){ return <div className={`card-footer ${className}`}>{children}</div> }

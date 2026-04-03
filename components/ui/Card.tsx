import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: string
}

export default function Card({ className = '', padding = 'p-6', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-sm border border-gray-100 ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

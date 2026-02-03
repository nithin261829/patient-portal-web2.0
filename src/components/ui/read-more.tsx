import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ReadMoreProps {
  text: string
  maxLines?: number
  className?: string
  expandedClassName?: string
}

export function ReadMore({
  text,
  maxLines = 2,
  className,
  expandedClassName
}: ReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text) return null

  return (
    <div className={cn("relative", className)}>
      <p
        className={cn(
          "text-sm text-muted-foreground transition-all duration-200",
          !isExpanded && "line-clamp-2",
          isExpanded && expandedClassName
        )}
        style={!isExpanded ? { WebkitLineClamp: maxLines } : undefined}
      >
        {text}
      </p>
      {text.length > 80 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="text-xs font-medium text-primary hover:text-primary/80 mt-1 touch-manipulation"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

// Mobile-optimized expandable card content
interface ExpandableContentProps {
  children: React.ReactNode
  preview: React.ReactNode
  className?: string
}

export function ExpandableContent({
  children,
  preview,
  className
}: ExpandableContentProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={cn("", className)}>
      {isExpanded ? (
        <>
          {children}
          <button
            onClick={() => setIsExpanded(false)}
            className="text-xs font-medium text-primary hover:text-primary/80 mt-2 touch-manipulation"
          >
            Show less
          </button>
        </>
      ) : (
        <>
          {preview}
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs font-medium text-primary hover:text-primary/80 mt-2 touch-manipulation"
          >
            Show more
          </button>
        </>
      )}
    </div>
  )
}

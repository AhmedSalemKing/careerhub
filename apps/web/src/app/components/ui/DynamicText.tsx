// components/ui/DynamicText.tsx
'use client'

import React from 'react'

interface TextObject {
  text: string
  font?: string
}

interface DynamicTextProps {
  content: string | TextObject[]
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function DynamicText({
  content,
  className = '',
  as: Component = 'span'
}: DynamicTextProps) {
  if (typeof content === 'string') {
    return <Component className={className}>{content}</Component>
  }

  return (
    <Component className={className}>
      {content.map((item, index) => (
        <React.Fragment key={index}>
          {typeof item === 'string' ? (
            item
          ) : (
            <span className={`font-${item.font || 'default'}`}>
              {item.text}
            </span>
          )}
        </React.Fragment>
      ))}
    </Component>
  )
}
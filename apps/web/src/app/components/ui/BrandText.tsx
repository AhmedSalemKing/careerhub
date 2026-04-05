'use client'

import React from 'react'

interface BrandTextProps {
  children: React.ReactNode
  className?: string
  brandWord?: string
  as?: keyof JSX.IntrinsicElements
}

export function BrandText({ 
  children, 
  className = '', 
  brandWord = 'مسارك',
  as: Component = 'span' 
}: BrandTextProps) {
  const text = React.Children.toArray(children).join('')
  
  if (!text.includes(brandWord)) {
    return <Component className={className}>{children}</Component>
  }

  const parts = text.split(brandWord)
  
  return (
    <Component className={className}>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part}
          {index < parts.length - 1 && (
            <span className="font-madinet">{brandWord}</span>
          )}
        </React.Fragment>
      ))}
    </Component>
  )
}

export function HeroTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <BrandText 
      brandWord="مسارك"
      className={`text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl ${className}`}
      as="h1"
    >
      {children}
    </BrandText>
  )
}

export function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <BrandText 
      brandWord="مسارك"
      className={`text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${className}`}
      as="h2"
    >
      {children}
    </BrandText>
  )
}

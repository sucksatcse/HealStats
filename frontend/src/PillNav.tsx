import React from "react"

export interface PillNavItem {
  id: string
  label: string
  labelBn?: string
  href?: string
  badge?: string
  badgeVariant?: "default" | "sos" | "warning"
  icon?: React.ReactNode
  onClick?: () => void
}

export interface PillNavProps {
  items: PillNavItem[]
  activeId?: string
  onSelect?: (id: string) => void
  lang?: "en" | "bn"
  className?: string
  variant?: "desktop" | "mobile" | "bare"
  animateReveal?: boolean
}

export default function PillNav({
  items,
  activeId,
  onSelect,
  lang = "en",
  className = "",
  variant = "desktop",
  animateReveal = false,
}: PillNavProps) {
  if (variant === "mobile") {
    return (
      <div className={`flex flex-col gap-1 w-full ${className}`} role="navigation" aria-label="Mobile Navigation">
        {items.map((item) => {
          const isActive = activeId === item.id
          const text = lang === "bn" && item.labelBn ? item.labelBn : item.label

          const badgeEl = item.badge && (
            <span
              className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                item.badgeVariant === "sos" || item.badge === "SOS"
                  ? "bg-red-500 text-white"
                  : item.badgeVariant === "warning"
                  ? "bg-amber-400 text-amber-900"
                  : "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200"
              }`}
            >
              {item.badge}
            </span>
          )

          const handleMobileClick = (e: React.MouseEvent) => {
            if (item.onClick) {
              if (!item.href) e.preventDefault()
              item.onClick()
            }
            onSelect?.(item.id)
          }

          if (item.href) {
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={handleMobileClick}
                className={`hs-mobile-pill-item ${isActive ? "is-active" : ""}`}
                data-nav-id={item.id}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && <span className="hs-pill-active-dot" aria-hidden="true" />}
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="truncate">{text}</span>
                {badgeEl}
              </a>
            )
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={handleMobileClick}
              className={`hs-mobile-pill-item ${isActive ? "is-active" : ""}`}
              data-nav-id={item.id}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && <span className="hs-pill-active-dot" aria-hidden="true" />}
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className="truncate">{text}</span>
              {badgeEl}
            </button>
          )
        })}
      </div>
    )
  }

  const isBare = variant === "bare"
  const renderedItems = items.map((item, index) => {
    const isActive = activeId === item.id
    const text = lang === "bn" && item.labelBn ? item.labelBn : item.label

    const badgeEl = item.badge && (
      <span
        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
          item.badgeVariant === "sos" || item.badge === "SOS"
            ? "bg-red-500 text-white"
            : item.badgeVariant === "warning"
            ? "bg-amber-400 text-amber-900"
            : "bg-teal-600 text-white"
        }`}
      >
        {item.badge}
      </span>
    )

    const innerContent = (
      <>
        {/* Signature expanding circle originating from bottom center */}
        <span className="hs-pill-circle" aria-hidden="true" />

        {/* Sliding text layers */}
        <span className="hs-pill-text-wrap">
          {/* Default text layer */}
          <span className="hs-pill-text-normal">
            {isActive && <span className="hs-pill-active-dot" aria-hidden="true" />}
            {item.icon && <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">{item.icon}</span>}
            <span>{text}</span>
            {badgeEl}
          </span>

          {/* Hover text layer (slides up from below on hover) */}
          <span className="hs-pill-text-hover" aria-hidden="true">
            {isActive && <span className="hs-pill-active-dot" />}
            {item.icon && <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">{item.icon}</span>}
            <span>{text}</span>
            {badgeEl}
          </span>
        </span>
      </>
    )

    const staggerStyle = {
      animationDelay: `${150 + index * 50}ms`,
    }

    const handleClick = (e: React.MouseEvent) => {
      if (item.onClick) {
        if (!item.href) e.preventDefault()
        item.onClick()
      }
      onSelect?.(item.id)
    }

    if (item.href) {
      return (
        <a
          key={item.id}
          href={item.href}
          onClick={handleClick}
          className={`hs-pill-item hs-pill-stagger ${isActive ? "is-active" : ""}`}
          style={staggerStyle}
          data-nav-id={item.id}
          aria-current={isActive ? "page" : undefined}
        >
          {innerContent}
        </a>
      )
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={handleClick}
        className={`hs-pill-item hs-pill-stagger ${isActive ? "is-active" : ""}`}
        style={staggerStyle}
        data-nav-id={item.id}
        aria-current={isActive ? "page" : undefined}
      >
        {innerContent}
      </button>
    )
  })

  if (isBare) {
    return (
      <div className={`hs-pill-nav-bare inline-flex items-center gap-1 ${className}`}>
        {renderedItems}
      </div>
    )
  }

  return (
    <nav
      className={`hs-pill-nav-container ${animateReveal ? "hs-animate-nav" : ""} ${className}`}
      aria-label="Main Navigation"
    >
      {renderedItems}
    </nav>
  )
}

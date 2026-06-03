import { useEffect, useRef } from 'react'

// Cmd/Ctrl+Enter fires a surface's primary save action. Bound to that handler only —
// never a destructive one — and inert while `enabled` is false (form invalid or mid-save).
// The keydown listener stays subscribed across renders; only `enabled` toggles it.
export function useSubmitShortcut(onSubmit, enabled = true) {
  const cb = useRef(onSubmit)
  useEffect(() => { cb.current = onSubmit }, [onSubmit])
  useEffect(() => {
    if (!enabled) return
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !e.isComposing) {
        e.preventDefault()
        cb.current()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled])
}

import { useState, useEffect } from "react"

/**
 * Debounce hook - delays updating value until user stops typing
 * Perfect for search inputs to avoid spamming API requests
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 * 
 * @example
 * const [search, setSearch] = useState("")
 * const debouncedSearch = useDebounce(search, 300)
 * 
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     searchAPI(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup: cancel timeout if value changes before delay expires
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

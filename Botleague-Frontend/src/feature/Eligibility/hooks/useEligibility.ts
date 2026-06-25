import { useEffect, useState } from "react"
import { getMyEligibility, type EligibilityResponse } from "../api/eligibility.api"

interface UseEligibilityResult {
  eligibility: EligibilityResponse | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useEligibility(): UseEligibilityResult {
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [tick, setTick]               = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getMyEligibility()
      .then(data => { if (!cancelled) setEligibility(data) })
      .catch(err  => {
        if (!cancelled) setError(err?.response?.data?.message ?? err?.message ?? "Failed to load eligibility")
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [tick])

  return {
    eligibility,
    loading,
    error,
    reload: () => setTick(t => t + 1),
  }
}

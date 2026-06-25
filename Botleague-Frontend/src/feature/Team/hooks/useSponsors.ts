import { useCallback, useEffect, useState } from "react";
import {
  getTeamSponsors, addSponsor, updateSponsor, deleteSponsor,
  type Sponsor, type SponsorRequest,
} from "../api/sponsor.api";

interface UseSponsorsResult {
  sponsors: Sponsor[];
  loading: boolean;
  error: string | null;
  add: (teamId: string, data: SponsorRequest) => Promise<void>;
  update: (sponsorId: string, data: SponsorRequest) => Promise<void>;
  remove: (sponsorId: string) => Promise<void>;
}

export function useSponsors(teamId: string | null | undefined): UseSponsorsResult {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      setSponsors(await getTeamSponsors(teamId));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load sponsors");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (tid: string, data: SponsorRequest) => {
    const created = await addSponsor(tid, data);
    setSponsors(prev => [...prev, created]);
  }, []);

  const update = useCallback(async (sponsorId: string, data: SponsorRequest) => {
    const updated = await updateSponsor(sponsorId, data);
    setSponsors(prev => prev.map(s => s.id === sponsorId ? updated : s));
  }, []);

  const remove = useCallback(async (sponsorId: string) => {
    await deleteSponsor(sponsorId);
    setSponsors(prev => prev.filter(s => s.id !== sponsorId));
  }, []);

  return { sponsors, loading, error, add, update, remove };
}

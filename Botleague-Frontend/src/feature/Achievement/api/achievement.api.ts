import api from "../../../shared/api/Base";

export interface AchievementDTO {
  id: string;
  userId: string;
  eventId: string | null;
  type: string;
  unlockedAt: string;
}

export const getMyAchievements = async (): Promise<AchievementDTO[]> => {
  const res = await api.get<AchievementDTO[]>("/v1/achievements/my");
  return res.data;
};

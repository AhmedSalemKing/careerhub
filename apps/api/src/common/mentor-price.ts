/**
 * A mentor's price is stored in three places: users.hourlyRate, user_profiles.sessionPrice
 * and (for legacy coaches) coaches.hourlyRate. Every write path must go through this helper so
 * the three never drift apart. users.hourlyRate is the canonical value when reading.
 */
type MentorPriceDb = {
  user: { update: (args: any) => Promise<unknown> };
  userProfile: { updateMany: (args: any) => Promise<unknown> };
  coach: { updateMany: (args: any) => Promise<unknown> };
};

export async function syncMentorPrice(db: MentorPriceDb, userId: string, price: number): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { hourlyRate: price } });
  await db.userProfile.updateMany({ where: { userId }, data: { sessionPrice: price } });
  // updateMany: most mentors have no Coach row, and Coach requires fields we must not invent.
  await db.coach.updateMany({ where: { userId }, data: { hourlyRate: price } });
}

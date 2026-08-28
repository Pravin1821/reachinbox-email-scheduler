export async function notifyRateLimitHit(senderId: string, limit: number) {
  console.log(`[slack-stub] would notify: sender ${senderId} hit limit of ${limit}/hour`);
}
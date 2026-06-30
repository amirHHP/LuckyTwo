import { prisma } from "./db";
import { getSimulatedTime } from "./timeMock";

// Ideal MBTI Complement Matches
const idealMatches: Record<string, string[]> = {
  INFJ: ["ENFP", "ENTP", "INTJ", "INFJ"],
  ENFP: ["INFJ", "INTJ", "ENFP", "ENTP"],
  INTJ: ["ENFP", "ENTP", "INFJ", "INTJ"],
  ENTP: ["INFJ", "INTJ", "ENFP", "ENTP"],
  INFP: ["ENFJ", "ENTJ", "INFP", "ENFP"],
  ENFJ: ["INFP", "ISFP", "ENFJ", "INFJ"],
  ISFP: ["ENFJ", "ESFJ", "ESTJ", "ISFP"],
  ESFJ: ["ISFP", "ISTP", "ESFJ", "ESTJ"],
  ISTP: ["ESFJ", "ESTJ", "ESTP", "ISTP"],
  ESTJ: ["ISTP", "ISFP", "ESTJ", "ESFJ"],
  ISTJ: ["ESTP", "ESFP", "ISTJ", "ISFJ"],
  ESTP: ["ISTJ", "ISFJ", "ESTP", "ISTP"],
  ISFJ: ["ESTP", "ESFP", "ISFJ", "ISTJ"],
  ESFP: ["ISTJ", "ISFJ", "ESFP", "ESTP"],
  INTP: ["ENTJ", "ENFJ", "INTP", "ENTP"],
  ENTJ: ["INTP", "INFP", "ENTJ", "INTJ"],
};

/**
 * Calculates compatibility score between two users.
 * Returns score (0-100) and if they share at least one geographic zone.
 */
export function calculateCompatibility(
  user1: { mbtiType: string | null; interests: string },
  user2: { mbtiType: string | null; interests: string }
): number {
  // 1. MBTI Compatibility (60% weight)
  let mbtiScore = 30; // base score
  const mbti1 = user1.mbtiType || "INFJ";
  const mbti2 = user2.mbtiType || "INFJ";

  if (idealMatches[mbti1]?.includes(mbti2)) {
    mbtiScore = 95;
  } else {
    // Calculate overlap in dimensions
    let matchingLetters = 0;
    for (let i = 0; i < 4; i++) {
      if (mbti1[i] === mbti2[i]) matchingLetters++;
    }
    if (matchingLetters === 4) mbtiScore = 90;
    else if (matchingLetters === 3) mbtiScore = 80;
    else if (matchingLetters === 2) mbtiScore = 60;
    else if (matchingLetters === 1) mbtiScore = 45;
  }

  // 2. Interests overlap (40% weight) - Jaccard index
  let interestScore = 0;
  try {
    const interests1: string[] = JSON.parse(user1.interests);
    const interests2: string[] = JSON.parse(user2.interests);

    const intersection = interests1.filter((i) => interests2.includes(i));
    const unionSize = new Set([...interests1, ...interests2]).size;

    interestScore = unionSize > 0 ? (intersection.length / unionSize) * 100 : 0;
  } catch (e) {
    console.error("Failed to parse interests in compatibility calculation:", e);
  }

  return Math.round(mbtiScore * 0.6 + interestScore * 0.4);
}

/**
 * Generates 3 mock future date/time options (slots) relative to the simulated current time.
 */
export function generateTimeSlots(baseDate: Date): Date[] {
  // Let's create slots relative to the current simulated date:
  // Slot 1: In 2 days at 4:00 PM
  const slot1 = new Date(baseDate);
  slot1.setDate(slot1.getDate() + 2);
  slot1.setHours(16, 0, 0, 0);

  // Slot 2: In 2 days at 7:00 PM
  const slot2 = new Date(baseDate);
  slot2.setDate(slot2.getDate() + 2);
  slot2.setHours(19, 0, 0, 0);

  // Slot 3: In 3 days at 5:00 PM
  const slot3 = new Date(baseDate);
  slot3.setDate(slot3.getDate() + 3);
  slot3.setHours(17, 0, 0, 0);

  return [slot1, slot2, slot3];
}

function pickMeetingZone(
  maleZones: string[],
  femaleZones: string[],
  cafesByZone: Map<string, { id: string; name: string }[]>
): string | null {
  const overlapping = maleZones.filter((z) => femaleZones.includes(z) && cafesByZone.has(z));
  if (overlapping.length > 0) return overlapping[0];

  const maleFallback = maleZones.find((z) => cafesByZone.has(z));
  if (maleFallback) return maleFallback;

  const femaleFallback = femaleZones.find((z) => cafesByZone.has(z));
  if (femaleFallback) return femaleFallback;

  return cafesByZone.keys().next().value ?? null;
}

/**
 * Runs the matchmaking engine. Pairs every searching user with the best available partner.
 * Compatibility score is used only for ranking — there is no minimum threshold.
 */
export async function runMatchmakingEngine(): Promise<{ matchesCreated: number; matchesDetails: any[] }> {
  const simulatedTime = await getSimulatedTime();

  const males = await prisma.user.findMany({
    where: { gender: "MALE", isSearching: true, isVerified: true, selfieStatus: "APPROVED" },
  });

  const females = await prisma.user.findMany({
    where: { gender: "FEMALE", isSearching: true, isVerified: true, selfieStatus: "APPROVED" },
  });

  const allCafes = await prisma.cafe.findMany({ where: { isVerified: true } });
  const cafesByZone = new Map<string, typeof allCafes>();
  for (const cafe of allCafes) {
    const list = cafesByZone.get(cafe.zone) ?? [];
    list.push(cafe);
    cafesByZone.set(cafe.zone, list);
  }

  if (cafesByZone.size === 0) {
    return { matchesCreated: 0, matchesDetails: [] };
  }

  let matchesCreated = 0;
  const matchesDetails = [];

  const matchedMales = new Set<string>();
  const matchedFemales = new Set<string>();

  for (const male of males) {
    if (matchedMales.has(male.id)) continue;

    const maleZones: string[] = JSON.parse(male.zones);
    const candidates = [];

    for (const female of females) {
      if (matchedFemales.has(female.id)) continue;

      const femaleZones: string[] = JSON.parse(female.zones);
      const meetingZone = pickMeetingZone(maleZones, femaleZones, cafesByZone);
      if (!meetingZone) continue;

      const score = calculateCompatibility(male, female);
      candidates.push({ female, meetingZone, score });
    }

    if (candidates.length === 0) continue;

    candidates.sort((a, b) => b.score - a.score);

    const bestMatch = candidates[0];
    const female = bestMatch.female;
    const commonZone = bestMatch.meetingZone;
    const chosenCafe = cafesByZone.get(commonZone)?.[0];
    if (!chosenCafe) continue;

    // Generate 3 time slot options
    const slots = generateTimeSlots(simulatedTime);

    // Create Match record
    const match = await prisma.match.create({
      data: {
        maleId: male.id,
        femaleId: female.id,
        status: "SCHEDULE_PENDING", // Initiated, waiting for scheduling slot lock
        compatibilityScore: bestMatch.score,
        cafeId: chosenCafe.id,
        timeSlotOptions: JSON.stringify(slots.map((s) => s.toISOString())),
        malePaid: true,  // Wallet was debited when initiating searching
        femalePaid: true, // Wallet was debited when initiating searching
      },
    });

    // De-activate searching status
    await prisma.user.update({
      where: { id: male.id },
      data: { isSearching: false, searchingSince: null },
    });

    await prisma.user.update({
      where: { id: female.id },
      data: { isSearching: false, searchingSince: null },
    });

    matchedMales.add(male.id);
    matchedFemales.add(female.id);

    matchesCreated++;
    matchesDetails.push({
      matchId: match.id,
      maleName: male.firstName,
      femaleName: female.firstName,
      cafe: chosenCafe.name,
      zone: commonZone,
      compatibilityScore: bestMatch.score,
      lowCompatibility: bestMatch.score < 60,
    });
  }

  return { matchesCreated, matchesDetails };
}

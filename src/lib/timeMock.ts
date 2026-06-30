import { prisma } from "./db";

/**
 * Gets the simulated current time by applying the offset stored in the database.
 */
export async function getSimulatedTime(): Promise<Date> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "time_offset_hours" },
  });
  const offsetHours = setting ? parseFloat(setting.value) : 0;
  return new Date(Date.now() + offsetHours * 60 * 60 * 1000);
}

/**
 * Updates the simulated clock offset in the database.
 */
export async function setSimulatedTimeOffset(hours: number): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: "time_offset_hours" },
    update: { value: hours.toString() },
    create: { key: "time_offset_hours", value: hours.toString() },
  });
}

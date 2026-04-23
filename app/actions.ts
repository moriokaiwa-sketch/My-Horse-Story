'use server'

import prisma from '@/lib/db'
import { fetchHorseProfile, fetchHorseEvents } from '@/lib/scraper/netkeiba'
import { revalidatePath } from 'next/cache'

export async function addHorse(formData: FormData) {
  const input = formData.get('netkeibaId') as string;
  if (!input) return { error: 'ID or URL is required' };

  // Support both full URL and just the ID
  let netkeibaId = input;
  const urlMatch = input.match(/db\.netkeiba\.com\/horse\/(\d+)/);
  if (urlMatch) {
    netkeibaId = urlMatch[1];
  }

  // Remove non-digits if needed, expecting 10 digits
  netkeibaId = netkeibaId.replace(/\D/g, '');

  if (!/^\d+$/.test(netkeibaId)) {
    return { error: 'Invalid netkeiba ID' };
  }

  // Check if exists
  const exists = await prisma.horse.findUnique({ where: { netkeibaId } });
  if (exists) return { error: 'Horse already registered' };

  try {
    const profile = await fetchHorseProfile(netkeibaId);
    if (!profile) return { error: 'Horse not found' };

    const horse = await prisma.horse.create({
      data: {
        name: profile.name,
        netkeibaId,
        profileUrl: profile.profileUrl,
        nextRace: profile.nextRace,
      }
    });

    const events = await fetchHorseEvents(netkeibaId, horse.id);
    if (events.length > 0) {
      await prisma.updateEvent.createMany({
        data: events,
      });
    }

    revalidatePath('/');
    revalidatePath('/horses');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to add horse' };
  }
}

export async function deleteHorse(horseId: string) {
  try {
    await prisma.horse.delete({
      where: { id: horseId }
    });
    // Cascade delete is already handled by Prisma schema for UpdateEvent
    revalidatePath('/');
    revalidatePath('/horses');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete horse' };
  }
}

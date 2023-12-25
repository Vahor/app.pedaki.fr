import { Status } from '@prisma/client';
import type {
  DatabaseResourceInput,
  DnsResourceInput,
  ServerResourceInput,
  VpcResourceInput,
} from '~/resource/resource.model';
import { z } from 'zod';

export interface WorkspaceData {
  workspace: {
    id: string;
    subdomain: string;
    subscriptionId: number;
    name: string;
    maintenanceWindow: string;
  };
  vpc: VpcResourceInput;
  server: ServerResourceInput;
  database: DatabaseResourceInput;
  dns: DnsResourceInput;
}

export const WorkspaceStatusSchema = z.nativeEnum(Status);
export type WorkspaceStatus = z.infer<typeof WorkspaceStatusSchema>;

const validDays = ['*', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MaintenanceWindowSchema = z.string().refine(
  value => {
    // split to check that the first day is before the second day
    // and that the first hour is before the second hour in the same day
    const [startDay, startHour, startMinute, endDay, endHour, endMinute] = value.split(/:|-/, 6);
    if (!startDay || !startHour || !startMinute || !endDay || !endHour || !endMinute) {
      return false;
    }
    const startHourNumber = parseInt(startHour, 10);
    const startMinuteNumber = parseInt(startMinute, 10);
    const endHourNumber = parseInt(endHour, 10);
    const endMinuteNumber = parseInt(endMinute, 10);

    if (
      startHourNumber < 0 ||
      startHourNumber > 23 ||
      startMinuteNumber < 0 ||
      startMinuteNumber > 59 ||
      endHourNumber < 0 ||
      endHourNumber > 23 ||
      endMinuteNumber < 0 ||
      endMinuteNumber > 59
    ) {
      return false;
    }

    if (!validDays.includes(startDay) || !validDays.includes(endDay)) {
      return false;
    }

    const startDayIndex = validDays.indexOf(startDay);
    const endDayIndex = validDays.indexOf(endDay);

    if (startDayIndex === endDayIndex) {
      // if same day, check that the start hour is before the end hour
      return (
        startHourNumber < endHourNumber ||
        (startHourNumber === endHourNumber && startMinuteNumber < endMinuteNumber)
      );
    }

    // if different days, check that the start day is before the end day
    return startDayIndex < endDayIndex;
  },
  {
    message: 'Value must be in the format "DAY:HH:MM-DAY:HH:MM" (e.g. "MON:00:00-TUE:00:00")',
  },
);

export const WorkspacePropertiesSchema = z.object({
  name: z.string().max(50),
  contactEmail: z.string().email(),
  contactName: z.string().max(128),
  logoUrl: z.string().url().max(1024),
  defaultLanguage: z.enum(['en', 'fr']), // TODO: sync with the languages in the frontend
  maintenanceWindow: MaintenanceWindowSchema,
  currentMaintenanceWindow: MaintenanceWindowSchema.optional(), // TODO: add a regex to validate the format
});
export type WorkspaceProperties = z.infer<typeof WorkspacePropertiesSchema>;


import PlatformSettings from '../models/PlatformSettings.js';
import AppError from '../utils/AppError.js';

// Default settings are created automatically if they don't exist.
export const getSettings = async () => {
  let settings = await PlatformSettings.findOne({ key: 'global' });

  if (!settings) {
    settings = await PlatformSettings.create({ key: 'global' });
  }

  return settings;
};

// Safe recursive merge: only update fields that already exist in the settings schema.
// Prevents admins from injecting arbitrary fields into the settings document.
const mergeAllowedSettings = (target, updates) => {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return;
  }

  for (const key of Object.keys(updates)) {
    if (!(key in target)) continue;

    const currentValue = target[key];
    const newValue = updates[key];

    if (
      currentValue &&
      typeof currentValue === 'object' &&
      !Array.isArray(currentValue) &&
      newValue &&
      typeof newValue === 'object' &&
      !Array.isArray(newValue)
    ) {
      mergeAllowedSettings(currentValue, newValue);
    } else {
      target[key] = newValue;
    }
  }
};

export const updateSettings = async (updates, adminId) => {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw new AppError('Invalid settings payload', 400);
  }

  const settings = await getSettings();

  // Prevent changing protected fields through the request body.
  delete updates.key;
  delete updates._id;
  delete updates.updatedBy;
  delete updates.createdAt;
  delete updates.updatedAt;
  delete updates.__v;

  mergeAllowedSettings(settings, updates);

  // Track which admin made the change
  settings.updatedBy = adminId;

  await settings.save();

  return settings;
};

export default {
  getSettings,
  updateSettings,
};

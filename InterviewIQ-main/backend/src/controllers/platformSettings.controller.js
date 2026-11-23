import platformSettingsService from '../services/platformSettings.service.js';

// ==================== GET ADMIN SETTINGS ====================
export const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await platformSettingsService.getSettings();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE ADMIN SETTINGS ====================
export const updatePlatformSettings = async (req, res, next) => {
  try {
    const settings = await platformSettingsService.updateSettings(
      req.body,
      req.user?._id
    );

    res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PUBLIC ANNOUNCEMENT ====================
export const getPublicAnnouncement = async (req, res, next) => {
  try {
    const settings = await platformSettingsService.getSettings();

    const announcement = settings?.announcement;

    // Only return enabled announcements with a non-empty message
    if (!announcement?.enabled || !announcement?.message?.trim()) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    // Expose only announcement information — never full platform settings
    res.status(200).json({
      success: true,
      data: {
        enabled: announcement.enabled,
        message: announcement.message,
        type: announcement.type,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getPlatformSettings,
  updatePlatformSettings,
  getPublicAnnouncement,
};
import resumeService from '../services/resume.service.js';

export const uploadResume = async (req, res, next) => {
  try {
    console.log('[resume.upload] request received', {
      userId: req.user?._id?.toString?.(),
      hasFile: Boolean(req.file),
      mimetype: req.file?.mimetype,
      filename: req.file?.originalname,
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please provide a PDF or DOCX file.'
      });
    }

    const result = await resumeService.uploadResume(req.user._id, req.file);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: result.resume,
      analysis: result.analysis,
      data: {
        resume: result.resume,
        analysis: result.analysis
      }
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload resume'
    });
  }
};

export const getUserResumes = async (req, res) => {
  try {
    const resumes = await resumeService.getUserResumes(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Resumes retrieved successfully',
      data: { resumes }
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve resumes'
    });
  }
};

export const getResumeById = async (req, res) => {
  try {
    const resume = await resumeService.getResumeById(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Resume retrieved successfully',
      data: { resume }
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve resume'
    });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const result = await resumeService.deleteResume(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete resume'
    });
  }
};

export const getResumeAnalysis = async (req, res) => {
  try {
    const analysis = await resumeService.getResumeAnalysis(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Analysis retrieved successfully',
      data: { analysis },
    });
  } catch (error) {
    console.error('Get resume analysis error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve analysis',
    });
  }
};

export const matchResume = async (req, res) => {
  try {
    const match = await resumeService.matchToTarget(req.params.id, req.user._id, req.body || {});
    res.status(200).json({ success: true, data: { match } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Match failed' });
  }
};
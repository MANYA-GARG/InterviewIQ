import { useState, useEffect, useCallback, useRef } from 'react';
import ResumeScoreCard from '../components/common/ResumeScoreCard';
import SkillComparison from '../components/common/SkillComparison';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Card from '../components/common/Card';
import { SkeletonCard } from '../components/common/Skeleton';
import { resumeService } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import ResumeMatchCard from '../components/common/ResumeMatchCard';



const Resumes = () => {
  const storeResumes = useAppStore((state) => state.resume.resumes);
  const storeAnalysis = useAppStore((state) => state.resume.analysis);
  const setStoreResumes = useAppStore((state) => state.setResumes);
  const setResumeAnalysis = useAppStore((state) => state.setResumeAnalysis);
  const setGlobalLoading = useAppStore((state) => state.setLoading);
  const setGlobalError = useAppStore((state) => state.setError);
  const clearError = useAppStore((state) => state.clearError);

  const [resumes, setResumes] = useState(() => storeResumes || []);
  const [analysisResult, setAnalysisResult] = useState(() => storeAnalysis || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

  const fetchResumes = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setGlobalLoading(true);
    clearError();
    setFetchError('');
    try {
      const response = await resumeService.getAll();
      const list = response.data?.resumes || response.resumes || [];
      if (isMountedRef.current) {
        setResumes(list);
        setStoreResumes(list);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load resumes';
      if (isMountedRef.current) {
        setGlobalError(message);
        setFetchError(message);
        toast.error(message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setGlobalLoading(false);
      }
    }
  }, [clearError, setGlobalError, setGlobalLoading, setStoreResumes]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchResumes();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchResumes]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((extension) =>
      fileNameLower.endsWith(extension)
    );
    const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.type);

    if (!hasValidExtension && !hasValidMimeType) {
      toast.error('Only PDF and DOCX files are supported');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await resumeService.upload(formData, {
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || file.size;
          if (!total) {
            return;
          }

          const progress = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(Math.min(100, Math.max(0, progress)));
        },
      });

      setUploadProgress(100);
      const analysis = response.analysis || response.data?.analysis || null;
      setAnalysisResult(analysis);
      setResumeAnalysis(analysis);
      toast.success('Resume uploaded successfully');
      fetchResumes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await resumeService.delete(id);
      toast.success('Resume deleted successfully');
      fetchResumes();
    } catch (error) {
      toast.error('Failed to delete resume');
    }
  };

  const handleAnalyze = async (resumeId) => {
    setAnalyzing(resumeId);
    try {
      const response = await resumeService.getAnalysis(resumeId);
      const analysis = response.data?.analysis || response.analysis;
      if (analysis) {
        setAnalysisResult(analysis);
        setResumeAnalysis(analysis);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error('Analysis not available');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load analysis');
    } finally {
      setAnalyzing(null);
    }
  };

  const categorizeSkills = (skills = []) => {
    const buckets = {
      Frontend: [],
      Backend: [],
      Tools: [],
    };

    skills.forEach((skillRaw) => {
      const skill = String(skillRaw).trim();
      const value = skill.toLowerCase();

      if (['react', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'redux', 'next', 'vue', 'angular'].some((term) => value.includes(term))) {
        buckets.Frontend.push(skill);
      } else if (['node', 'express', 'mongodb', 'postgres', 'mysql', 'rest', 'graphql', 'api', 'java', 'python', 'django'].some((term) => value.includes(term))) {
        buckets.Backend.push(skill);
      } else {
        buckets.Tools.push(skill);
      }
    });

    return buckets;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <ErrorState
        message="Unable to load resume data"
        description={fetchError}
        onRetry={fetchResumes}
      />
    );
  }

  return (
    <div className="space-y-8">
        <Card title="Resume Upload" subtitle="Upload a resume to generate skill analysis and personalize interview questions.">
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className={`inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-base font-medium text-white transition-all hover:bg-indigo-700 ${uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
              <Upload className="h-5 w-5 mr-2" />
              {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Resume'}
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <span className="text-sm text-slate-500">Supported: PDF, DOCX (not DOC). Max size: 5MB</span>
          </div>
          {uploading && (
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-indigo-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-600">Upload in progress: {uploadProgress}%</p>
            </div>
          )}
        </Card>

        {analysisResult && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Resume Analysis</h2>
              <span
                className={`rounded-full px-4 py-1 text-sm font-bold ${
                  (analysisResult.score ?? 0) >= 70
                    ? 'bg-green-100 text-green-700'
                    : (analysisResult.score ?? 0) >= 40
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {(analysisResult.score ?? 0) >= 70
                  ? '★ Strong'
                  : (analysisResult.score ?? 0) >= 40
                  ? '~ Moderate'
                  : '✗ Weak'}{' '}
                · {analysisResult.score ?? 0}%
              </span>
            </div>

            <ResumeScoreCard
              overallScore={analysisResult.score ?? 0}
              scores={{
                structure: analysisResult.structureScore ?? analysisResult.score ?? 0,
                experience: analysisResult.experienceScore ?? analysisResult.score ?? 0,
                skills: analysisResult.skillsScore ?? analysisResult.score ?? 0,
                achievements: analysisResult.achievementsScore ?? analysisResult.score ?? 0,
              }}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Resume Score</p>
                <p
                  className={`text-2xl font-bold ${
                    (analysisResult.score ?? 0) >= 70
                      ? 'text-green-600'
                      : (analysisResult.score ?? 0) >= 40
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {analysisResult.score ?? 0}%
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Word Count</p>
                <p className="text-2xl font-bold text-slate-900">{analysisResult.wordCount ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Skills Detected</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(analysisResult.detectedSkills ?? analysisResult.skillsFound ?? []).length}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <SkillComparison
                presentSkills={analysisResult.detectedSkills ?? analysisResult.skillsFound ?? []}
                missingSkills={analysisResult.missingSkills ?? []}
                title="Skills Gap Analysis"
              />
            </div>

            {analysisResult.suggestions?.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-slate-700">💡 Improvement Suggestions</p>
                <ul className="list-disc list-inside space-y-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  {analysisResult.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

<ResumeMatchCard resumeId={resumes[0]?._id} />
        {analysisResult && (() => {
          const detectedSkills = analysisResult.detectedSkills ?? analysisResult.skillsFound ?? [];
          const categorizedSkills = categorizeSkills(detectedSkills);
          const missingSkills = analysisResult.missingSkills ?? [];
          const suggestions = analysisResult.suggestions ?? [];
          const score = analysisResult.score ?? 0;

          return (
            <Card title="Resume Analysis Enhancement" subtitle="Advanced visualization and categorized skill insights.">
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-700">Overall Resume Strength</p>
                    <p className="text-lg font-bold text-slate-900">{score}%</p>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(categorizedSkills).map(([category, skillList]) => (
                    <div key={category} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900 mb-3">{category}</p>
                      {skillList.length ? (
                        <div className="flex flex-wrap gap-2">
                          {skillList.map((skill, index) => (
                            <span
                              key={`${category}-${skill}-${index}`}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">No skills detected in this category</p>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">Missing Skills (High Priority)</p>
                  {missingSkills.length ? (
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.map((skill, index) => (
                        <span
                          key={`missing-${skill}-${index}`}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-700">No critical missing skills identified.</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">Improvement Suggestions</p>
                  {suggestions.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestions.map((suggestion, index) => (
                        <div key={`suggestion-card-${index}`} className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                          <p className="text-sm text-blue-900">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No additional suggestions available.</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })()}

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">My Resumes</h2>
            <p className="text-slate-600 mt-1">Uploaded documents and extracted skills</p>
          </div>
        </div>

        {resumes.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileText}
              message="No resumes uploaded yet"
              description="Upload your first resume to generate AI analysis and personalized interview content."
            />
            <div className="mt-4 flex justify-center">
              <label className={`inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-base font-medium text-white transition-all hover:bg-indigo-700 ${uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                <Upload className="h-5 w-5 mr-2" />
                {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Your First Resume'}
                <input type="file" accept=".pdf,.docx" onChange={handleUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <Card key={resume._id} className="hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <FileText className="h-10 w-10 text-primary-600" />
                  <button
                    onClick={() => handleDelete(resume._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 truncate">
                  {resume.filename}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
                </p>
                {resume.skills && resume.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resume.skills.slice(0, 5).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {resume.skills.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{resume.skills.length - 5} more
                      </span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handleAnalyze(resume._id)}
                  disabled={analyzing === resume._id}
                  className="mt-3 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-60"
                >
                  {analyzing === resume._id ? 'Analyzing…' : 'View Analysis'}
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
  );
};

export default Resumes;

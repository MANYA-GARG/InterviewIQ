import { useEffect, useState } from 'react';
import platformSettingsService from '../services/platformSettingsService';

const defaultSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  announcement: {
    enabled: false,
    message: '',
    type: 'info',
  },
  aiFeatures: {
    interviewQuestionGeneration: true,
    interviewEvaluation: true,
    interviewFeedback: true,
    resumeAnalysis: true,
    resumeBuilder: true,
    studyPlanGeneration: true,
    adaptiveAssessment: true,
    answerEvaluation: true,
  },
  limits: {
    maxInterviewsPerUserPerDay: 5,
    maxQuestionsPerInterview: 20,
    maxResumeUploadsPerUser: 5,
  },
  adaptiveAssessment: {
    enabled: true,
    minQuestions: 5,
    maxQuestions: 20,
    standardErrorThreshold: 0.3,
  },
  aiConfiguration: {
    provider: 'groq',
    model: '',
  },
};

const featureLabels = {
  interviewQuestionGeneration: {
    label: 'Interview Question Generation',
    description: 'Generate role-specific interview questions using AI.',
  },
  interviewEvaluation: {
    label: 'Interview Evaluation',
    description: 'Analyze candidate answers and calculate performance scores.',
  },
  interviewFeedback: {
    label: 'AI Interview Feedback',
    description: 'Generate detailed feedback and improvement suggestions.',
  },
  resumeAnalysis: {
    label: 'Resume Analysis',
    description: 'Analyze resumes, skills and candidate profiles.',
  },
  resumeBuilder: {
    label: 'AI Resume Builder',
    description: 'Enable AI-powered resume creation and improvement.',
  },
  studyPlanGeneration: {
    label: 'Study Plan Generation',
    description: 'Generate personalized preparation roadmaps.',
  },
  adaptiveAssessment: {
    label: 'Adaptive Assessment',
    description: 'Allow interviews to adjust based on candidate performance.',
  },
  answerEvaluation: {
    label: 'Answer Evaluation',
    description: 'Evaluate individual answers against expected competencies.',
  },
};

const styles = {
  page: {
    padding: '28px',
    color: '#e5e7eb',
    minHeight: '100%',
    background: '#0b1120',
  },
  heading: {
    fontSize: '27px',
    fontWeight: 700,
    marginBottom: '8px',
    color: '#f8fafc',
  },
  subheading: {
    color: '#94a3b8',
    marginBottom: '25px',
    fontSize: '14px',
  },
  card: {
    background: '#111a2c',
    border: '1px solid #263349',
    borderRadius: '14px',
    padding: '22px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '6px',
  },
  sectionDescription: {
    color: '#94a3b8',
    fontSize: '13px',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
  },
  input: {
    background: '#0b1120',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '11px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '15px',
    padding: '15px 0',
    borderBottom: '1px solid #253146',
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    color: '#e2e8f0',
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '4px',
  },
  toggleDescription: {
    color: '#94a3b8',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  switch: {
    width: '46px',
    height: '25px',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    transition: '0.2s',
  },
  button: {
    border: 'none',
    borderRadius: '9px',
    padding: '12px 20px',
    background: '#6366f1',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #334155',
    borderRadius: '9px',
    padding: '12px 20px',
    background: '#172235',
    color: '#cbd5e1',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        ...styles.switch,
        background: checked ? '#6366f1' : '#334155',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          width: '19px',
          height: '19px',
          borderRadius: '50%',
          background: '#ffffff',
          top: '3px',
          left: checked ? '24px' : '3px',
          transition: '0.2s',
        }}
      />
    </button>
  );
}

function SettingsSection({ title, description, children }) {
  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {description && <p style={styles.sectionDescription}>{description}</p>}
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', min, max, step }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        type={type}
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) =>
          onChange(type === 'number' ? Number(e.target.value) : e.target.value)
        }
      />
    </div>
  );
}

export default function PlatformSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await platformSettingsService.getSettings();

      if (response?.data) {
        setSettings((prev) => ({
          ...prev,
          ...response.data,
          announcement: {
            ...prev.announcement,
            ...response.data.announcement,
          },
          aiFeatures: {
            ...prev.aiFeatures,
            ...response.data.aiFeatures,
          },
          limits: {
            ...prev.limits,
            ...response.data.limits,
          },
          adaptiveAssessment: {
            ...prev.adaptiveAssessment,
            ...response.data.adaptiveAssessment,
          },
          aiConfiguration: {
            ...prev.aiConfiguration,
            ...response.data.aiConfiguration,
          },
        }));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load platform settings. Check your authentication.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateTopLevel = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (
      settings.adaptiveAssessment.minQuestions >
      settings.adaptiveAssessment.maxQuestions
    ) {
      setError('Minimum questions cannot be greater than maximum questions.');
      return;
    }

    try {
      setSaving(true);

      await platformSettingsService.updateSettings(settings);

      setSuccess('Platform settings saved successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to save settings. Please check your connection and authorization.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadSettings();
    setSuccess('');
    setError('');
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>Loading platform settings...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={styles.heading}>Platform Settings</h1>
        <p style={styles.subheading}>
          Configure platform behavior, AI capabilities, usage limits and
          assessment policies.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div
          style={{
            padding: '14px',
            marginBottom: '20px',
            background: '#451a22',
            border: '1px solid #7f1d1d',
            color: '#fca5a5',
            borderRadius: '10px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '14px',
            marginBottom: '20px',
            background: '#123326',
            border: '1px solid #166534',
            color: '#86efac',
            borderRadius: '10px',
          }}
        >
          ✓ {success}
        </div>
      )}

      {/* Platform Status */}
      <SettingsSection
        title="Platform Status"
        description="Control platform availability and new user access."
      >
        <div style={styles.toggleRow}>
          <div style={styles.toggleText}>
            <div style={styles.toggleLabel}>Maintenance Mode</div>
            <div style={styles.toggleDescription}>
              Enable maintenance mode during updates or critical operations.
            </div>
          </div>
          <Toggle
            checked={settings.maintenanceMode}
            onChange={(value) => updateTopLevel('maintenanceMode', value)}
          />
        </div>

        <div style={styles.toggleRow}>
          <div style={styles.toggleText}>
            <div style={styles.toggleLabel}>User Registration</div>
            <div style={styles.toggleDescription}>
              Allow new users to create InterviewIQ accounts.
            </div>
          </div>
          <Toggle
            checked={settings.registrationEnabled}
            onChange={(value) => updateTopLevel('registrationEnabled', value)}
          />
        </div>
      </SettingsSection>

      {/* AI Features */}
      <SettingsSection
        title="AI Feature Controls"
        description="Individually enable or disable AI-powered platform features."
      >
        {Object.entries(featureLabels).map(([key, feature]) => (
          <div key={key} style={styles.toggleRow}>
            <div style={styles.toggleText}>
              <div style={styles.toggleLabel}>{feature.label}</div>
              <div style={styles.toggleDescription}>{feature.description}</div>
            </div>
            <Toggle
              checked={settings.aiFeatures[key]}
              onChange={(value) => updateField('aiFeatures', key, value)}
            />
          </div>
        ))}
      </SettingsSection>

      {/* Usage Limits */}
      <SettingsSection
        title="Usage Limits"
        description="Set platform-wide limits to manage resource consumption and fair usage."
      >
        <div style={styles.grid}>
          <Field
            label="Interviews per User / Day"
            type="number"
            min={1}
            value={settings.limits.maxInterviewsPerUserPerDay}
            onChange={(value) =>
              updateField('limits', 'maxInterviewsPerUserPerDay', value)
            }
          />

          <Field
            label="Questions per Interview"
            type="number"
            min={1}
            value={settings.limits.maxQuestionsPerInterview}
            onChange={(value) =>
              updateField('limits', 'maxQuestionsPerInterview', value)
            }
          />

          <Field
            label="Resume Uploads per User"
            type="number"
            min={1}
            value={settings.limits.maxResumeUploadsPerUser}
            onChange={(value) =>
              updateField('limits', 'maxResumeUploadsPerUser', value)
            }
          />
        </div>
      </SettingsSection>

      {/* Adaptive Assessment */}
      <SettingsSection
        title="Adaptive Assessment"
        description="Configure the behavior of adaptive interviews and assessment stopping criteria."
      >
        <div style={styles.toggleRow}>
          <div style={styles.toggleText}>
            <div style={styles.toggleLabel}>Enable Adaptive Assessment</div>
            <div style={styles.toggleDescription}>
              Allow the assessment engine to adapt based on candidate performance.
            </div>
          </div>
          <Toggle
            checked={settings.adaptiveAssessment.enabled}
            onChange={(value) =>
              updateField('adaptiveAssessment', 'enabled', value)
            }
          />
        </div>

        <div style={{ ...styles.grid, marginTop: '20px' }}>
          <Field
            label="Minimum Questions"
            type="number"
            min={1}
            value={settings.adaptiveAssessment.minQuestions}
            onChange={(value) =>
              updateField('adaptiveAssessment', 'minQuestions', value)
            }
          />

          <Field
            label="Maximum Questions"
            type="number"
            min={1}
            value={settings.adaptiveAssessment.maxQuestions}
            onChange={(value) =>
              updateField('adaptiveAssessment', 'maxQuestions', value)
            }
          />

          <Field
            label="Standard Error Threshold"
            type="number"
            min={0.01}
            step={0.01}
            value={settings.adaptiveAssessment.standardErrorThreshold}
            onChange={(value) =>
              updateField(
                'adaptiveAssessment',
                'standardErrorThreshold',
                value
              )
            }
          />
        </div>
      </SettingsSection>

      {/* Announcement */}
      <SettingsSection
        title="Platform Announcement"
        description="Display a platform-wide announcement to users."
      >
        <div style={styles.toggleRow}>
          <div style={styles.toggleText}>
            <div style={styles.toggleLabel}>Show Announcement</div>
            <div style={styles.toggleDescription}>
              Display the announcement banner across the platform.
            </div>
          </div>
          <Toggle
            checked={settings.announcement.enabled}
            onChange={(value) => updateField('announcement', 'enabled', value)}
          />
        </div>

        <div style={{ ...styles.grid, marginTop: '20px' }}>
          <div style={styles.field}>
            <label style={styles.label}>Announcement Type</label>
            <select
              style={styles.input}
              value={settings.announcement.type}
              onChange={(e) =>
                updateField('announcement', 'type', e.target.value)
              }
            >
              <option value="info">Information</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Important / Error</option>
            </select>
          </div>
        </div>

        <div style={{ ...styles.field, marginTop: '18px' }}>
          <label style={styles.label}>Announcement Message</label>
          <textarea
            style={{
              ...styles.input,
              minHeight: '100px',
              resize: 'vertical',
            }}
            maxLength={500}
            value={settings.announcement.message}
            onChange={(e) =>
              updateField('announcement', 'message', e.target.value)
            }
            placeholder="Write an announcement for InterviewIQ users..."
          />
          <span style={{ color: '#64748b', fontSize: '12px' }}>
            {settings.announcement.message.length}/500 characters
          </span>
        </div>
      </SettingsSection>

      {/* AI Configuration */}
      <SettingsSection
        title="AI Configuration"
        description="Configure the default AI provider and model for platform operations."
      >
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Provider</label>
            <select
              style={styles.input}
              value={settings.aiConfiguration.provider}
              onChange={(e) =>
                updateField('aiConfiguration', 'provider', e.target.value)
              }
            >
              <option value="groq">Groq</option>
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Field
            label="Model Name"
            value={settings.aiConfiguration.model}
            onChange={(value) =>
              updateField('aiConfiguration', 'model', value)
            }
          />
        </div>

        <p style={{ color: '#fbbf24', fontSize: '12px', marginTop: '16px' }}>
          ⚠️ API keys must remain in backend environment variables and should
          never be configured or displayed here.
        </p>
      </SettingsSection>

      {/* Save Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '10px 0 30px',
          flexWrap: 'wrap',
        }}
      >
        <button style={styles.secondaryButton} onClick={handleReset}>
          Discard Changes
        </button>

        <button
          style={{
            ...styles.button,
            opacity: saving ? 0.6 : 1,
          }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
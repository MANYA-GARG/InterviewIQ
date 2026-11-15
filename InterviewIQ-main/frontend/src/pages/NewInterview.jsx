import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { interviewService, resumeService } from '../services/api';
import toast from 'react-hot-toast';
import { Briefcase } from 'lucide-react';

const NewInterview = () => {
  const [formData, setFormData] = useState({
    jobRole: '',
    experienceLevel: 'intermediate',
    numberOfQuestions: 5,
    mode: 'text',
    timerDuration: 120,
    resumeId: '',
  });
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await resumeService.getAll();
      setResumes(response.data?.resumes || response.resumes || []);
    } catch (error) {
      console.error('Failed to fetch resumes');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['numberOfQuestions', 'timerDuration'];
    setFormData({
      ...formData,
      [name]: numericFields.includes(name) ? Number(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await interviewService.create(formData);
      const interview = response.data?.interview || response.interview;

      if (!interview?._id) {
        throw new Error('Interview payload was invalid');
      }

      toast.success('Interview created successfully');
      navigate(`/interview/${interview._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Start Mock Interview</h1>
          <p className="text-slate-600 mt-2">
            Set up your mock interview parameters
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Briefcase className="absolute left-3 top-[37px] h-5 w-5 text-slate-400" />
              <Input
                label="Job Role"
                type="text"
                name="jobRole"
                value={formData.jobRole}
                onChange={handleChange}
                className="pl-10"
                placeholder="e.g., Full Stack Developer, Data Scientist"
                required
              />
            </div>

            <Input
              as="select"
              label="Experience Level"
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              required
            >
                <option value="fresher">Fresher (0-1 years)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="experienced">Experienced (3+ years)</option>
            </Input>

            <Input
              label="Number of Questions"
              type="number"
              name="numberOfQuestions"
              value={formData.numberOfQuestions}
              onChange={handleChange}
              min="3"
              max="15"
              helperText="Choose between 3 and 15 questions"
              required
            />

            <Input
              as="select"
              label="Interview Mode"
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              helperText="Voice mode uses speech-to-text and AI evaluation"
              required
            >
                <option value="text">Text (Typed answers)</option>
                <option value="voice">Voice (Recorded answers)</option>
            </Input>

            {formData.mode === 'voice' && (
              <Input
                label="Timer Duration (seconds)"
                type="number"
                name="timerDuration"
                value={formData.timerDuration}
                onChange={handleChange}
                min="60"
                max="180"
                helperText="Choose between 60 and 180 seconds"
                required
              />
            )}

            <Input
              as="select"
              label="Select Resume (Optional)"
              name="resumeId"
              value={formData.resumeId}
              onChange={handleChange}
              helperText="Using a resume will generate personalized questions"
            >
                <option value="">None - General questions</option>
                {resumes.map((resume) => (
                  <option key={resume._id} value={resume._id}>
                    {resume.filename}
                  </option>
                ))}
            </Input>

            <div className="flex space-x-4">
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
              >
                Create Interview
              </Button>
              <Button
                type="button"
                onClick={() => navigate('/dashboard')}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
  );
};

export default NewInterview;

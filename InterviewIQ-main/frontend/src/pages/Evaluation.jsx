
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { evaluationService } from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, Award, CheckCircle, AlertCircle } from 'lucide-react';

const Evaluation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvaluation();
  }, [id]);

  const fetchEvaluation = async () => {
    try {
      const response = await evaluationService.getByInterviewId(id);
      setEvaluation(response.data.evaluation);
    } catch (error) {
      toast.error('Failed to load evaluation');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Interview Evaluation
            </h1>
            <p className="text-gray-600 mt-1">
              {evaluation.interview.jobRole}
            </p>
          </div>

          <div className="text-center">
            <div className="text-5xl font-bold text-primary-600">
              {evaluation.overallScore}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Overall Score
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="card text-center">
          <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {evaluation.categoryScores.technical}
          </div>
          <div className="text-sm text-gray-600">Technical</div>
        </div>

        <div className="card text-center">
          <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {evaluation.categoryScores.communication}
          </div>
          <div className="text-sm text-gray-600">Communication</div>
        </div>

        <div className="card text-center">
          <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {evaluation.categoryScores.problemSolving}
          </div>
          <div className="text-sm text-gray-600">Problem Solving</div>
        </div>

        <div className="card text-center">
          <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {evaluation.categoryScores.confidence}
          </div>
          <div className="text-sm text-gray-600">Confidence</div>
        </div>

      </div>

      {/* Overall Feedback */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Overall Feedback
        </h2>

        <div className="space-y-4">

          <div>
            <h3 className="font-semibold text-green-700 mb-2">
              Strengths
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {evaluation.overallFeedback.strengths.map((strength, index) => (
                <li key={index} className="text-gray-700">
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-orange-700 mb-2">
              Areas for Improvement
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {evaluation.overallFeedback.improvements.map((improvement, index) => (
                <li key={index} className="text-gray-700">
                  {improvement}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-blue-700 mb-2">
              Recommendations
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {evaluation.overallFeedback.recommendations.map((recommendation, index) => (
                <li key={index} className="text-gray-700">
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Question-wise Evaluation */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Question-wise Evaluation
        </h2>

        <div className="space-y-4">
          {evaluation.questionEvaluations.map((qEval, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">
                  Q{index + 1}: {qEval.question.questionText}
                </h3>

                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-bold">
                  {qEval.score}/10
                </span>
              </div>

              <p className="text-gray-700 text-sm mb-3">
                {qEval.feedback}
              </p>

              {qEval.strengths.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium text-green-700">
                    Strengths:{' '}
                  </span>
                  <span className="text-gray-600">
                    {qEval.strengths.join(', ')}
                  </span>
                </div>
              )}

              {qEval.improvements.length > 0 && (
                <div className="text-sm mt-1">
                  <span className="font-medium text-orange-700">
                    Improvements:{' '}
                  </span>
                  <span className="text-gray-600">
                    {qEval.improvements.join(', ')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => navigate(`/study-plan?interview=${id}`)}>
          Get my 7-day study plan
        </Button>

        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>

    </div>
  );
};

export default Evaluation;

import { ScoreCircle } from './ScoreCircle';
import { TrendingUp, AlertCircle } from 'lucide-react';

export const ResumeScoreCard = ({
  overallScore = 0,
  scores = {
    structure: 0,
    experience: 0,
    skills: 0,
    achievements: 0,
  },
  trend = null,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
          <ScoreCircle score={overallScore} size="lg" />
          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-gray-600">Overall Resume Score</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{overallScore}/100</p>
            {trend && (
              <div className="flex items-center justify-center gap-1 mt-3 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{trend} from last review</span>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          
          {Object.entries(scores).map(([category, score]) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-sm font-bold text-gray-900">{score}/100</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    score >= 80
                      ? 'bg-green-500'
                      : score >= 60
                      ? 'bg-blue-500'
                      : score >= 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Ways to Improve Your Resume</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Add quantifiable achievements and metrics</li>
              <li>• Include relevant technical skills for the target role</li>
              <li>• Highlight leadership and collaboration experiences</li>
              <li>• Keep the format clean and ATS-friendly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeScoreCard;

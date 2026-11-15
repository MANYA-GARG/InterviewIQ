/**
 * Answer Analysis Result Component
 * Displays comprehensive analysis and feedback for interview answers
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Clock,
  Target,
  Award,
} from 'lucide-react';
import analysisService from '../../services/analysis.js';

const AnswerAnalysisResult = ({ answerId, onClose, question, answer }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analysis on component mount
  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        if (answerId) {
          // Database-backed analysis
          result = await analysisService.analyzeSingleAnswer(answerId);
        } else if (question && answer) {
          // Quick analysis
          result = await analysisService.quickAnalyze(question, answer);
        } else {
          throw new Error('Missing required parameters');
        }

        setAnalysis(result.data);
      } catch (err) {
        setError(err.message || 'Failed to analyze answer');
        console.error('Analysis error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [answerId, question, answer]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <BarChart3 className="w-12 h-12 text-blue-600" />
          </div>
          <p className="text-gray-600 font-medium">Analyzing your answer...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-red-900">Analysis Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analysis data available</p>
      </div>
    );
  }

  const {
    analysis: analysisData,
    report,
    finalScore,
    strengths,
    improvements,
  } = analysis;

  const { localAnalysis } = analysisData;

  // Helper function to get score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-900';
    if (score >= 60) return 'bg-blue-100 text-blue-900';
    if (score >= 40) return 'bg-yellow-100 text-yellow-900';
    return 'bg-red-100 text-red-900';
  };

  // Helper function to get progress bar color
  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Score Card Component
  const ScoreCard = ({ label, score, icon: Icon }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
      <Icon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
      <div className="flex-1">
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor(score)} transition-all`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className={`text-lg font-bold px-2 py-1 rounded-md ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Final Score */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">Answer Analysis</h2>
            <p className="text-blue-100">Comprehensive feedback on your interview response</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{finalScore}</div>
            <p className="text-blue-100 text-sm mt-1">Final Score</p>
            <div className="mt-3 inline-block bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full text-sm">
              {report?.summary?.performanceCategory}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['overview', 'breakdown', 'recommendations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Score Cards Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Detailed Breakdown</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <ScoreCard label="Keyword Relevance" score={localAnalysis.keywordScore} icon={Target} />
              <ScoreCard label="Answer Structure" score={localAnalysis.structureScore} icon={BarChart3} />
              <ScoreCard label="Confidence Level" score={localAnalysis.confidenceScore} icon={Award} />
              <ScoreCard label="Answer Length" score={localAnalysis.lengthScore} icon={Clock} />
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-green-900">Key Strengths</h3>
            </div>
            <ul className="space-y-2">
              {strengths.map((strength, idx) => (
                <li key={idx} className="text-green-800 flex gap-2">
                  <span className="text-green-600 font-bold">→</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-yellow-900">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {improvements.map((improvement, idx) => (
                <li key={idx} className="text-yellow-800 flex gap-2">
                  <span className="text-yellow-600 font-bold">◆</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-6 grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Word Count</p>
              <p className="text-2xl font-bold text-gray-900">{localAnalysis.wordCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sentiment</p>
              <p className="text-2xl font-bold text-gray-900">
                {localAnalysis.sentimentScore >= 60 ? 'Positive' : 'Neutral'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">STAR Format</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(localAnalysis.hasStar).filter(Boolean).length}/4
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && report && (
        <div className="space-y-6">
          <div className="grid gap-4">
            {Object.entries(report.breakdown).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(value.score)}`}>
                    {value.status}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Score</span>
                    <span className="text-lg font-bold text-gray-900">{value.score}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(value.score)} transition-all`}
                      style={{ width: `${value.score}%` }}
                    />
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && report && (
        <div className="space-y-4">
          {report.recommendations.map((rec, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-white ${
                    rec.priority === 'High' ? 'bg-red-600' :
                    rec.priority === 'Medium' ? 'bg-yellow-600' :
                    'bg-blue-600'
                  }`}>
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.action}</h4>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{rec.tip}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
        <button
          onClick={() => {
            const dataStr = JSON.stringify(analysis, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `analysis_${Date.now()}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
          }}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Export Analysis
        </button>
      </div>
    </div>
  );
};

export default AnswerAnalysisResult;

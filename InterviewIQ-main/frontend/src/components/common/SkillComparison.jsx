import { CheckCircle, XCircle } from 'lucide-react';

export const SkillComparison = ({ 
  skills = [], 
  presentSkills = [],
  missingSkills = [],
  title = "Skills Analysis"
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Present Skills */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Your Skills</h4>
          </div>
          <div className="space-y-2">
            {presentSkills.length > 0 ? (
              presentSkills.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-900">{skill}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 italic">No skills identified yet</div>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-gray-900">Missing Skills</h4>
          </div>
          <div className="space-y-2">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-red-900">{skill}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 italic">No missing skills</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillComparison;

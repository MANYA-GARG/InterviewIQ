export const SkillTag = ({ skill, hasSkill = true, category = 'General' }) => {
  if (hasSkill) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
        {skill}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
      </svg>
      {skill}
    </span>
  );
};

export const SkillCategory = ({ title, skills = [], hasSkills = [] }) => {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <SkillTag key={idx} skill={skill} hasSkill={hasSkills.includes(skill)} />
        ))}
      </div>
    </div>
  );
};

export default SkillTag;

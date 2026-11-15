import { useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  ExternalLink,
  Flame,
  Medal,
  PlayCircle,
  Rocket,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import CodeEditor from '../components/preparation/CodeEditor';

const STORAGE_KEY = 'interviewiq_preparation_hub_progress_v1';
const META_STORAGE_KEY = 'interviewiq_preparation_hub_meta_v1';

const PREP_TRACKS = [
  {
    key: 'product',
    icon: Building2,
    title: 'Product-Based Companies (MNC)',
    subtitle: 'High-bar interviews focused on depth and structured problem solving',
    focus: 'DSA + System Design',
    topics: ['Arrays, Trees, Graphs', 'Dynamic Programming', 'OOPS + DBMS + OS'],
  },
  {
    key: 'service',
    icon: Briefcase,
    title: 'Service-Based Companies',
    subtitle: 'Strong fundamentals, communication, and practical coding ability',
    focus: 'Basics + Communication',
    topics: ['Core Java / JavaScript', 'SQL', 'Aptitude', 'HR Questions'],
  },
];

const DSA_SHEET = [
  {
    key: 'arrays',
    title: 'Arrays',
    problems: [
      { id: 'arrays-two-sum', name: 'Two Sum', difficulty: 'Easy' },
      { id: 'arrays-best-time-stock', name: 'Best Time to Buy and Sell Stock', difficulty: 'Easy' },
      { id: 'arrays-kadanes', name: "Kadane's Algorithm", difficulty: 'Medium' },
      { id: 'arrays-sort-colors', name: 'Sort Colors', difficulty: 'Medium' },
      { id: 'arrays-next-permutation', name: 'Next Permutation', difficulty: 'Medium' },
      { id: 'arrays-merge-intervals', name: 'Merge Intervals', difficulty: 'Medium' },
      { id: 'arrays-rotate-image', name: 'Rotate Image', difficulty: 'Medium' },
      { id: 'arrays-set-matrix-zeroes', name: 'Set Matrix Zeroes', difficulty: 'Medium' },
      { id: 'arrays-majority-element', name: 'Majority Element', difficulty: 'Easy' },
      { id: 'arrays-trapping-rain-water', name: 'Trapping Rain Water', difficulty: 'Hard' },
      { id: 'arrays-product-except-self', name: 'Product of Array Except Self', difficulty: 'Medium' },
      { id: 'arrays-subarray-sum-k', name: 'Subarray Sum Equals K', difficulty: 'Medium' },
    ],
  },
  {
    key: 'strings',
    title: 'Strings',
    problems: [
      { id: 'strings-valid-anagram', name: 'Valid Anagram', difficulty: 'Easy' },
      { id: 'strings-longest-substring', name: 'Longest Substring Without Repeating Characters', difficulty: 'Medium' },
      { id: 'strings-longest-palindromic', name: 'Longest Palindromic Substring', difficulty: 'Medium' },
      { id: 'strings-group-anagrams', name: 'Group Anagrams', difficulty: 'Medium' },
      { id: 'strings-zigzag-conversion', name: 'Zigzag Conversion', difficulty: 'Medium' },
      { id: 'strings-roman-to-integer', name: 'Roman to Integer', difficulty: 'Easy' },
      { id: 'strings-string-to-integer', name: 'String to Integer (atoi)', difficulty: 'Medium' },
      { id: 'strings-palindrome-number', name: 'Palindrome Number', difficulty: 'Easy' },
      { id: 'strings-min-window', name: 'Minimum Window Substring', difficulty: 'Hard' },
      { id: 'strings-implement-strstr', name: 'Find the Index of the First Occurrence in a String', difficulty: 'Easy' },
    ],
  },
  {
    key: 'linked-list',
    title: 'Linked List',
    problems: [
      { id: 'll-reverse', name: 'Reverse Linked List', difficulty: 'Easy' },
      { id: 'll-middle', name: 'Middle of the Linked List', difficulty: 'Easy' },
      { id: 'll-merge-two', name: 'Merge Two Sorted Lists', difficulty: 'Easy' },
      { id: 'll-remove-nth', name: 'Remove Nth Node From End of List', difficulty: 'Medium' },
      { id: 'll-add-two', name: 'Add Two Numbers', difficulty: 'Medium' },
      { id: 'll-detect-cycle', name: 'Linked List Cycle II', difficulty: 'Medium' },
      { id: 'll-intersection', name: 'Intersection of Two Linked Lists', difficulty: 'Easy' },
      { id: 'll-palindrome', name: 'Palindrome Linked List', difficulty: 'Easy' },
      { id: 'll-copy-random', name: 'Copy List with Random Pointer', difficulty: 'Medium' },
    ],
  },
  {
    key: 'stack-queue',
    title: 'Stack & Queue',
    problems: [
      { id: 'sq-valid-parentheses', name: 'Valid Parentheses', difficulty: 'Easy' },
      { id: 'sq-min-stack', name: 'Min Stack', difficulty: 'Medium' },
      { id: 'sq-implement-queue-using-stacks', name: 'Implement Queue using Stacks', difficulty: 'Easy' },
      { id: 'sq-implement-stack-using-queues', name: 'Implement Stack using Queues', difficulty: 'Easy' },
      { id: 'sq-next-greater', name: 'Next Greater Element II', difficulty: 'Medium' },
      { id: 'sq-daily-temperatures', name: 'Daily Temperatures', difficulty: 'Medium' },
      { id: 'sq-sliding-window-max', name: 'Sliding Window Maximum', difficulty: 'Hard' },
      { id: 'sq-lru-cache', name: 'LRU Cache', difficulty: 'Medium' },
      { id: 'sq-rotten-oranges', name: 'Rotting Oranges', difficulty: 'Medium' },
    ],
  },
  {
    key: 'trees',
    title: 'Trees',
    problems: [
      { id: 'trees-inorder', name: 'Binary Tree Inorder Traversal', difficulty: 'Easy' },
      { id: 'trees-level-order', name: 'Binary Tree Level Order Traversal', difficulty: 'Medium' },
      { id: 'trees-max-depth', name: 'Maximum Depth of Binary Tree', difficulty: 'Easy' },
      { id: 'trees-diameter', name: 'Diameter of Binary Tree', difficulty: 'Easy' },
      { id: 'trees-balanced', name: 'Balanced Binary Tree', difficulty: 'Easy' },
      { id: 'trees-same-tree', name: 'Same Tree', difficulty: 'Easy' },
      { id: 'trees-lca', name: 'Lowest Common Ancestor of a Binary Tree', difficulty: 'Medium' },
      { id: 'trees-construct-pre-in', name: 'Construct Binary Tree from Preorder and Inorder', difficulty: 'Medium' },
      { id: 'trees-serialize', name: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard' },
    ],
  },
  {
    key: 'graphs',
    title: 'Graphs',
    problems: [
      { id: 'graphs-number-of-islands', name: 'Number of Islands', difficulty: 'Medium' },
      { id: 'graphs-flood-fill', name: 'Flood Fill', difficulty: 'Easy' },
      { id: 'graphs-clone-graph', name: 'Clone Graph', difficulty: 'Medium' },
      { id: 'graphs-course-schedule', name: 'Course Schedule', difficulty: 'Medium' },
      { id: 'graphs-course-schedule-ii', name: 'Course Schedule II', difficulty: 'Medium' },
      { id: 'graphs-rotting-oranges', name: 'Rotting Oranges', difficulty: 'Medium' },
      { id: 'graphs-word-ladder', name: 'Word Ladder', difficulty: 'Hard' },
      { id: 'graphs-dijkstra-network-delay', name: 'Network Delay Time', difficulty: 'Medium' },
      { id: 'graphs-disjoint-set-redundant', name: 'Redundant Connection', difficulty: 'Medium' },
    ],
  },
  {
    key: 'dynamic-programming',
    title: 'Dynamic Programming',
    problems: [
      { id: 'dp-climbing-stairs', name: 'Climbing Stairs', difficulty: 'Easy' },
      { id: 'dp-house-robber', name: 'House Robber', difficulty: 'Medium' },
      { id: 'dp-coin-change', name: 'Coin Change', difficulty: 'Medium' },
      { id: 'dp-longest-increasing-subsequence', name: 'Longest Increasing Subsequence', difficulty: 'Medium' },
      { id: 'dp-longest-common-subsequence', name: 'Longest Common Subsequence', difficulty: 'Medium' },
      { id: 'dp-word-break', name: 'Word Break', difficulty: 'Medium' },
      { id: 'dp-edit-distance', name: 'Edit Distance', difficulty: 'Hard' },
      { id: 'dp-partition-equal-subset', name: 'Partition Equal Subset Sum', difficulty: 'Medium' },
      { id: 'dp-target-sum', name: 'Target Sum', difficulty: 'Medium' },
    ],
  },
];

const difficultyClasses = {
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-rose-50 text-rose-700 border-rose-200',
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const withProblemLinks = (name) => ({
  leetcode: `https://leetcode.com/problemset/?search=${encodeURIComponent(name)}`,
  gfg: `https://www.geeksforgeeks.org/?s=${encodeURIComponent(name)}`,
});

const loadProgress = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const loadMeta = () => {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      activityDays: Array.isArray(parsed.activityDays) ? parsed.activityDays : [],
      practiceSessions: Number.isFinite(parsed.practiceSessions) ? parsed.practiceSessions : 0,
    };
  } catch {
    return { activityDays: [], practiceSessions: 0 };
  }
};

const PreparationHub = () => {
  const [completedMap, setCompletedMap] = useState(loadProgress);
  const [expandedMap, setExpandedMap] = useState(() => ({ arrays: true }));
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceProblem, setPracticeProblem] = useState(null);
  const [meta, setMeta] = useState(loadMeta);

  const allProblems = useMemo(() => DSA_SHEET.flatMap((topic) => topic.problems), []);
  const totalProblems = allProblems.length;

  const completedProblems = useMemo(
    () => allProblems.filter((problem) => Boolean(completedMap[problem.id])).length,
    [allProblems, completedMap]
  );

  const overallProgress = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;

  const topicProgress = useMemo(
    () =>
      DSA_SHEET.map((topic) => {
        const solved = topic.problems.reduce((sum, problem) => sum + (completedMap[problem.id] ? 1 : 0), 0);
        const ratio = topic.problems.length ? solved / topic.problems.length : 0;
        return { ...topic, solved, ratio };
      }),
    [completedMap]
  );

  const currentStreak = useMemo(() => {
    const days = new Set(meta.activityDays);
    let streak = 0;
    const cursor = new Date();
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (!days.has(key)) {
        break;
      }
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [meta.activityDays]);

  const recommendedNext = useMemo(() => {
    const rankedTopics = [...topicProgress]
      .filter((topic) => topic.solved < topic.problems.length)
      .sort((a, b) => a.ratio - b.ratio);

    const selectedTopic = rankedTopics[0];
    if (!selectedTopic) {
      return null;
    }

    const nextProblem = selectedTopic.problems.find((problem) => !completedMap[problem.id]) || null;
    if (!nextProblem) {
      return null;
    }

    return {
      topicKey: selectedTopic.key,
      topicTitle: selectedTopic.title,
      problem: nextProblem,
      links: withProblemLinks(nextProblem.name),
    };
  }, [completedMap, topicProgress]);

  const level = useMemo(() => {
    if (overallProgress >= 80) return 'Advanced';
    if (overallProgress >= 50) return 'Skilled';
    if (overallProgress >= 25) return 'Intermediate';
    return 'Beginner';
  }, [overallProgress]);

  const badges = useMemo(
    () => [
      { label: 'First Solve', unlocked: completedProblems >= 1 },
      { label: '10 Solved', unlocked: completedProblems >= 10 },
      { label: '30 Solved', unlocked: completedProblems >= 30 },
      { label: 'Consistency 3d', unlocked: currentStreak >= 3 },
    ],
    [completedProblems, currentStreak]
  );

  const todayMission = useMemo(() => {
    const weakestTopic = [...topicProgress].sort((a, b) => a.ratio - b.ratio)[0];
    const reviseProblem = allProblems.find((problem) => completedMap[problem.id]);
    return [
      recommendedNext
        ? `Solve ${recommendedNext.problem.name} (${recommendedNext.topicTitle})`
        : 'Solve one unsolved problem from your weakest topic',
      reviseProblem ? `Revise ${reviseProblem.name}` : 'Revise one previously solved easy problem',
      weakestTopic
        ? `Practice ${weakestTopic.title} (${weakestTopic.problems.length - weakestTopic.solved} remaining)`
        : 'Practice one medium-level topic',
    ];
  }, [allProblems, completedMap, recommendedNext, topicProgress]);

  const persistMeta = (nextMeta) => {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(nextMeta));
    setMeta(nextMeta);
  };

  const toggleProblem = (problemId) => {
    setCompletedMap((prev) => {
      const next = { ...prev, [problemId]: !prev[problemId] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      if (!prev[problemId]) {
        const today = getTodayKey();
        const activityDaysSet = new Set(meta.activityDays);
        activityDaysSet.add(today);
        persistMeta({
          ...meta,
          activityDays: Array.from(activityDaysSet),
        });
      }

      return next;
    });
  };

  const toggleTopic = (topicKey) => {
    setExpandedMap((prev) => ({ ...prev, [topicKey]: !prev[topicKey] }));
  };

  const startPracticeMode = (problem = null, topicKey = null) => {
    setPracticeMode(true);
    const targetProblem =
      problem ||
      recommendedNext?.problem ||
      allProblems.find((item) => !completedMap[item.id]) ||
      allProblems[0];

    if (targetProblem) {
      setPracticeProblem(targetProblem);
    }

    const targetTopicKey = topicKey || recommendedNext?.topicKey;
    if (targetTopicKey) {
      setExpandedMap((prev) => ({ ...prev, [targetTopicKey]: true }));
      const nextMeta = {
        ...meta,
        practiceSessions: meta.practiceSessions + 1,
      };
      persistMeta(nextMeta);
      const section = document.getElementById(`topic-${targetTopicKey}`);
      section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 py-2">
      <header className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 p-4 text-white shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <BookOpen className="h-3.5 w-3.5" />
          Preparation Hub
        </div>
        <h1 className="mt-2 text-2xl font-bold">Interview Preparation Hub</h1>
        <p className="mt-1 text-sm text-blue-100">Unified roadmap for company preparation and Striver-style DSA tracking.</p>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-blue-100">Solved</p>
            <p className="text-lg font-bold">{completedProblems}/{totalProblems}</p>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-blue-100">Current Streak</p>
            <p className="inline-flex items-center gap-1.5 text-lg font-bold">
              <Flame className="h-4 w-4 text-amber-300" />
              {currentStreak} day{currentStreak === 1 ? '' : 's'}
            </p>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-blue-100">Level</p>
            <p className="inline-flex items-center gap-1.5 text-lg font-bold">
              <Medal className="h-4 w-4 text-cyan-200" />
              {level}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-white/15 bg-white/10 p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">Overall DSA Progress</span>
            <span>{completedProblems}/{totalProblems} completed ({overallProgress}%)</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
              <Target className="h-4 w-4 text-indigo-600" />
              Today's Mission
            </h2>
            <button
              type="button"
              onClick={startPracticeMode}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Start Now
            </button>
          </div>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {todayMission.map((task) => (
              <li key={task} className="flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-2">
                <CalendarCheck className="h-4 w-4 text-emerald-600" />
                {task}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Achievements
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
                  badge.unlocked
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                {badge.label}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Practice sessions launched: {meta.practiceSessions}</p>
        </article>
      </section>

      {recommendedNext ? (
        <section className={`rounded-xl border p-3 shadow-sm ${practiceMode ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended Next Problem</p>
              <h3 className="text-sm font-bold text-slate-900">{recommendedNext.problem.name}</h3>
              <p className="text-xs text-slate-600">{recommendedNext.topicTitle} • {recommendedNext.problem.difficulty}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={recommendedNext.links.leetcode}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                LeetCode <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={recommendedNext.links.gfg}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                GFG <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => startPracticeMode(recommendedNext.problem, recommendedNext.topicKey)}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <Rocket className="h-3.5 w-3.5" />
                Start Practice Mode
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Great job, you completed the current sheet. Move to revision sets and timed contests.</p>
        </section>
      )}

      {practiceMode && practiceProblem ? (
        <CodeEditor problem={practiceProblem} />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {PREP_TRACKS.map((track) => {
          const Icon = track.icon;
          return (
            <article key={track.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{track.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{track.subtitle}</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Focus</p>
                <p className="text-sm font-medium text-slate-800">{track.focus}</p>
              </div>
              <ul className="mt-3 space-y-1.5">
                {track.topics.map((topic) => (
                  <li key={topic} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {topic}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Code2 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Striver-Style DSA Sheet</h2>
        </div>

        <div className="space-y-2.5">
          {DSA_SHEET.map((topic) => {
            const isExpanded = Boolean(expandedMap[topic.key]);
            const topicCompleted = topic.problems.reduce(
              (sum, problem) => sum + (completedMap[problem.id] ? 1 : 0),
              0
            );

            return (
              <div key={topic.key} id={`topic-${topic.key}`} className="rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.key)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{topic.title}</p>
                      <p className="text-xs text-slate-500">{topic.problems.length} problems</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {topicCompleted}/{topic.problems.length} completed
                  </span>
                </button>

                {isExpanded ? (
                  <div className="border-t border-slate-200 px-3 py-2.5">
                    <ul className="space-y-1.5">
                      {topic.problems.map((problem) => {
                        const checked = Boolean(completedMap[problem.id]);
                        const links = withProblemLinks(problem.name);
                        return (
                          <li key={problem.id} className="rounded-md border border-slate-100 px-2.5 py-2 transition hover:border-slate-200 hover:bg-slate-50">
                            <div className="flex items-start justify-between gap-3">
                              <label className="flex cursor-pointer items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleProblem(problem.id)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                                <span className={`text-sm ${checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {problem.name}
                              </span>
                            </label>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${difficultyClasses[problem.difficulty]}`}>
                                {problem.difficulty}
                              </span>
                            </div>

                            <div className="mt-1.5 ml-6 flex flex-wrap gap-1.5">
                              <a
                                href={links.leetcode}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                LeetCode <ExternalLink className="h-3 w-3" />
                              </a>
                              <a
                                href={links.gfg}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                GFG <ExternalLink className="h-3 w-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => startPracticeMode(problem, topic.key)}
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                              >
                                <PlayCircle className="h-3 w-3" />
                                Practice
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default PreparationHub;
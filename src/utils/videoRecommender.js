/**
 * Deterministic rules-based video recommendation engine.
 * Scores each video from the library against the user's form data,
 * computed profile, and score, then returns the top recommendations.
 */

import { VIDEO_LIBRARY } from '../data/videoLibrary.js';

/**
 * Reason templates mapped to rule keys.
 */
const REASON_TEMPLATES = {
  exploring: 'Recommended because you are still exploring your affordable price range.',
  has_property: 'Recommended because you already have a specific property in mind.',
  urgent: 'Recommended because you plan to buy within three months.',
  first_home: 'Recommended because this is your first home purchase.',
  investment: 'Recommended because you are financing an investment property.',
  high_ltv: 'Recommended because your current own-funds position is close to an important LTV boundary.',
  young_joint: 'Recommended because you are applying with a younger co-applicant.',
  affordability_gap: 'Recommended because your estimated capacity is below the required financing.',
  rate_sensitive: 'Recommended because interest rates significantly affect your borrowing capacity.',
  bottleneck: 'Recommended because it relates to your key constraint: {bottleneck}.',
  risk: 'Recommended because your profile has factors that banks may flag.',
};

/**
 * Default reason when no rules match.
 */
const DEFAULT_REASON = 'Recommended as essential mortgage knowledge.';

/**
 * Check if a video has any of the given topics.
 */
function hasAnyTopic(video, topics) {
  return video.topics.some(t => topics.includes(t));
}

/**
 * Check if a video has any of the given goals.
 */
function hasAnyGoal(video, goals) {
  return video.relatedGoals.some(g => goals.includes(g));
}

/**
 * Recommend videos based on user form data, computed profile, and score.
 *
 * @param {object} formData - Raw form inputs from the user
 * @param {object} profile - Computed scoring profile (eX, eXBase, eXStress, ltvBreached, bottleneck, riskStatus, etc.)
 * @param {number} score - Overall score value
 * @returns {{ primary: { video: object, reason: string }, secondary: Array<{ video: object, reason: string }> }}
 */
export function recommendVideos(formData, profile, score) {
  const formDataSafe = formData || {};
  const profileSafe = profile || {};

  // Track scores and best reasons per video
  const videoScores = VIDEO_LIBRARY.filter(v => v.available).map(video => ({
    video,
    points: 0,
    bestRule: null,
    bestPoints: 0,
  }));

  /**
   * Apply points to videos matching a condition, track the rule for reason generation.
   */
  function applyRule(ruleKey, points, filterFn) {
    for (const entry of videoScores) {
      if (filterFn(entry.video)) {
        entry.points += points;
        if (points > entry.bestPoints) {
          entry.bestPoints = points;
          entry.bestRule = ruleKey;
        }
      }
    }
  }

  // --- Rule: User is still exploring ---
  const isExploring = formDataSafe.propertyMode === 'discovering';
  if (isExploring) {
    applyRule('exploring', 10, v => hasAnyTopic(v, ['affordability', 'mortgage-capacity']));
    applyRule('exploring', 8, v => hasAnyTopic(v, ['pre-approval']));
    applyRule('exploring', 5, v => hasAnyGoal(v, ['exploring']));
  }

  // --- Rule: User has specific property ---
  const hasProperty = formDataSafe.propertyMode === 'defined' && formDataSafe.purchasePrice > 0;
  if (hasProperty) {
    applyRule('has_property', 10, v => hasAnyTopic(v, ['pre-approval', 'reservation-agreement']));
    applyRule('has_property', 8, v => hasAnyTopic(v, ['escrow', 'bank-valuation']));
    applyRule('has_property', 5, v => hasAnyGoal(v, ['buying-specific-property']));
  }

  // --- Rule: Timeline is urgent ---
  const isUrgent = formDataSafe.purchaseTimeline === '3months';
  if (isUrgent) {
    applyRule('urgent', 5, v => hasAnyTopic(v, ['pre-approval', 'escrow', 'reservation-agreement']));
  }

  // --- Rule: First-home buyer ---
  const isFirstHome = formDataSafe.applicantAge < 36 && formDataSafe.propertyPurpose === 'primary';
  if (isFirstHome) {
    applyRule('first_home', 6, v => hasAnyTopic(v, ['pre-approval', 'LTV', 'down-payment']));
    applyRule('first_home', 4, v => hasAnyGoal(v, ['buying-specific-property']));
  }

  // --- Rule: Investment property ---
  const isInvestment = formDataSafe.propertyPurpose === 'investment';
  if (isInvestment) {
    applyRule('investment', 8, v => hasAnyTopic(v, ['bank-valuation', 'interest-rates']));
    applyRule('investment', 5, v => hasAnyGoal(v, ['improving-rate']));
  }

  // --- Rule: High LTV ---
  const purchasePrice = formDataSafe.purchasePrice || 0;
  const ownFunds = formDataSafe.ownFunds || 0;
  const ltvPct = purchasePrice > 0 ? ((purchasePrice - ownFunds) / purchasePrice) * 100 : 0;
  const isHighLtv = ltvPct > 75 || profileSafe.ltvBreached;
  if (isHighLtv) {
    applyRule('high_ltv', 10, v => hasAnyTopic(v, ['LTV', 'down-payment', 'bank-valuation']));
    applyRule('high_ltv', 5, v => hasAnyGoal(v, ['high-ltv']));
  }

  // --- Rule: Young joint applicant ---
  const isYoungJoint = formDataSafe.applicantAge < 36 && formDataSafe.numberOfApplicants > 1;
  if (isYoungJoint) {
    applyRule('young_joint', 4, v => hasAnyTopic(v, ['LTV', 'down-payment']));
  }

  // --- Rule: Affordability gap ---
  const loanNeeded = purchasePrice > 0 ? purchasePrice - ownFunds : 0;
  const hasAffordabilityGap = profileSafe.eX > 0 && profileSafe.eX < loanNeeded;
  if (hasAffordabilityGap) {
    applyRule('affordability_gap', 10, v => hasAnyTopic(v, ['mortgage-capacity', 'affordability']));
    applyRule('affordability_gap', 8, v => hasAnyGoal(v, ['affordability-gap']));
  }

  // --- Rule: Interest rate sensitivity ---
  const isRateSensitive = profileSafe.eXBase > 0 && profileSafe.eXStress > 0 &&
    profileSafe.eXBase > profileSafe.eXStress * 1.3;
  if (isRateSensitive) {
    applyRule('rate_sensitive', 8, v => hasAnyTopic(v, ['interest-rates']));
    applyRule('rate_sensitive', 5, v => hasAnyGoal(v, ['improving-rate']));
  }

  // --- Rule: Bottleneck matches relatedFactors ---
  if (profileSafe.bottleneck) {
    applyRule('bottleneck', 7, v => v.relatedFactors.includes(profileSafe.bottleneck));
  }

  // --- Rule: Risk status ---
  const isHighRisk = profileSafe.riskStatus === 'cervena';
  if (isHighRisk) {
    applyRule('risk', 12, v => hasAnyTopic(v, ['rejected-application', 'credit-profile', 'mortgage-capacity']));
    applyRule('risk', 6, v => hasAnyGoal(v, ['rejected', 'affordability-gap']));
  }

  // Sort by points descending, then by priority ascending (lower priority number = better)
  videoScores.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return a.video.priority - b.video.priority;
  });

  /**
   * Build a reason string for a video entry.
   */
  function buildReason(entry) {
    if (!entry.bestRule) {
      return DEFAULT_REASON;
    }
    const template = REASON_TEMPLATES[entry.bestRule] || DEFAULT_REASON;
    if (entry.bestRule === 'bottleneck' && profileSafe.bottleneck) {
      return template.replace('{bottleneck}', profileSafe.bottleneck);
    }
    return template;
  }

  // If no rules matched at all (all scores are 0), fall back to priority order
  const hasAnyPoints = videoScores.some(e => e.points > 0);
  if (!hasAnyPoints) {
    const byPriority = [...videoScores].sort((a, b) => a.video.priority - b.video.priority);
    return {
      primary: {
        video: byPriority[0].video,
        reason: DEFAULT_REASON,
      },
      secondary: [
        { video: byPriority[1].video, reason: DEFAULT_REASON },
        { video: byPriority[2].video, reason: DEFAULT_REASON },
      ],
    };
  }

  return {
    primary: {
      video: videoScores[0].video,
      reason: buildReason(videoScores[0]),
    },
    secondary: [
      { video: videoScores[1].video, reason: buildReason(videoScores[1]) },
      { video: videoScores[2].video, reason: buildReason(videoScores[2]) },
    ],
  };
}

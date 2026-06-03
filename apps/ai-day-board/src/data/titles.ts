// Job titles for AI Day participants, sourced from Slack profiles (snapshot
// pulled 2026-06-03). These are the default "real title" line shown under the
// name on the 1:1 profile, above the "AI Ambassador" tag everyone shares.
// A per-participant text field in Profile Studio can override any of these.
// To refresh from Slack, re-run the slack_search_users lookup and update here.

export const SLACK_TITLES: Record<string, string> = {
  "Brennan Gerster": "Chief Business Officer - GM Consumer",
  "Brian O'Neil": "SVP, AI & Platform Engineering",
  "Dan Margulies": "Chief Information Officer",
  "Dave de Sa": "VP, Data and Analytics",
  "Elizabeth Martin": "Senior Manager, Platform Engineering",
  "Erik Petersen": "Lead Solutions Architect",
  "Jack Kreps": "VP, FP&A",
  "James Baker": "Staff DevOps Engineer",
  "James Belanger": "VP, Meteorology",
  "Javi Quinones": "Manager, IT Service Desk",
  "Lauriana Gaudet": "Staff Applied Meteorological Scientist",
  "Matthew Drooker": "Chief Technology Officer",
  "Max Jacubowsky": "Principal Machine Learning Engineer",
  "Michelle Kilroy": "Chief People & Communications Officer",
  "Miguel Gervassi": "Staff Machine Learning Ops Engineer",
  "Rohit Agarwal": "Chief Executive Officer",
  "Rohit Nutalapati": "Software Engineer",
  "Sahana Subbanna": "Manager, Software Engineering",
  "Sam Gates": "Director, Total Rewards & Operations",
  "Samantha Gates": "Director, Total Rewards & Operations",
  "Shannon King": "Senior Director, People & Culture",
  "Thomas Hinson": "Staff Software Engineer",
  "Tyler Steben": "Lead Product Manager",
};

/** The Slack-sourced job title for a participant, or "" if unknown. */
export function resolveTitle(name: string): string {
  return SLACK_TITLES[name] ?? "";
}

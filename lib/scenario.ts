export type PerformanceIndicator = {
  id: string;
  /** Official DECA code, e.g. "MP:008". */
  code: string;
  instructionalArea: string;
  /**
   * Official PI wording, verbatim. This is the authoritative statement — do not
   * elaborate on or paraphrase beyond it.
   */
  statement: string;
};

export type Scenario = {
  id: string;
  title: string;
  eventCode: "MTDM";
  prompt: string;
  performanceIndicators: PerformanceIndicator[];
  /** Official MTDM presentation time limit — fixed by the event format, not case-specific. */
  presentationTimeSeconds: number;
};

/** Official MTDM roleplay timing — fixed by the event format, not case-specific. */
export const PREP_SECONDS = 30 * 60;
export const PRESENTATION_SECONDS = 15 * 60;

/**
 * Placeholder MTDM case built around 7 official DECA Performance Indicators
 * (provided by the user). The PI codes/statements are official; the business
 * case narrative itself is an original placeholder — no official MTDM case
 * document has been provided yet.
 */
export const HARDCODED_SCENARIO: Scenario = {
  id: "mtdm-summitgear-001",
  title: "SummitGear Co.: Reaching the Urban Explorer",
  eventCode: "MTDM",
  prompt: `SummitGear Co. is a 25-year-old outdoor equipment manufacturer best known for its
"Summit Trail 35" backpack — a rugged, expedition-grade pack built for multi-day backcountry
trips. The Summit Trail 35 retails for $189 and is sold almost exclusively through 340
independent outdoor specialty stores across the country, plus SummitGear's own website.
Marketing has historically focused on print ads in outdoor/adventure magazines and sponsorships
of backcountry guiding trips.

SummitGear's core customers are serious backpackers, typically age 35-55, who take 8-12
overnight backcountry trips per year. Over the past three years, this segment has been shrinking
by about 3% annually, and Summit Trail 35 revenue is down 9% over the past two years.

Company-commissioned market research has identified a different, faster-growing segment: "urban
explorers," ages 22-34, who live in or near cities. They take occasional day hikes and weekend
trips, but more often use a rugged, weather-resistant backpack for daily commuting, air travel,
and errands. This segment represents an estimated $410 million national addressable market
growing at roughly 14% per year. Urban explorers typically spend $60-90 on a backpack, shop
primarily on Amazon, at mass-market retailers, and directly from brand websites, and discover
products mainly through social media and influencer content rather than outdoor magazines.
Competitors such as Cotopaxi and Fjällräven already sell heavily into this segment with
lower-priced, casual-styled packs and a strong social media presence — categories SummitGear
does not currently compete in.

SummitGear's leadership is considering whether and how to adapt the Summit Trail 35 platform —
potentially as a new variant — to reach urban explorers, without abandoning its position with
its traditional backcountry customer base. You have been asked to present a marketing
recommendation to SummitGear's executive team.`,
  performanceIndicators: [
    {
      id: "mp-008",
      code: "MP:008",
      instructionalArea: "Market Planning",
      statement:
        "Explain the role of situation analysis in the marketing planning process",
    },
    {
      id: "mk-014",
      code: "MK:014",
      instructionalArea: "Marketing Fundamentals",
      statement:
        "Explain factors that influence customer/client/business buying behavior",
    },
    {
      id: "pm-207",
      code: "PM:207",
      instructionalArea: "Product/Service Management",
      statement: "Describe factors used by businesses to position corporate brands",
    },
    {
      id: "pi-002",
      code: "PI:002",
      instructionalArea: "Pricing",
      statement: "Explain factors affecting pricing decisions",
    },
    {
      id: "pr-003",
      code: "PR:003",
      instructionalArea: "Promotion",
      statement: "Identify the elements of the promotional mix",
    },
    {
      id: "cm-003",
      code: "CM:003",
      instructionalArea: "Channel Management",
      statement: "Explain the nature of channels of distribution",
    },
    {
      id: "mp-001",
      code: "MP:001",
      instructionalArea: "Market Planning",
      statement: "Explain the concept of marketing strategies",
    },
  ],
  presentationTimeSeconds: PRESENTATION_SECONDS,
};

export function getScenario(scenarioId: string): Scenario | null {
  if (scenarioId !== HARDCODED_SCENARIO.id) return null;
  return HARDCODED_SCENARIO;
}

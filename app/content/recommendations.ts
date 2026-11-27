export type Recommendation = {
  /** A verbatim excerpt from the LinkedIn recommendation. Keep it to a few sentences. */
  quote: string;
  name: string;
  title: string;
  /** How you worked together, as LinkedIn states it. */
  relation?: string;
};

// One quote shows as a single card, two sit side by side, three or more become a carousel with arrows.
export const recommendations: Recommendation[] = [
  {
    quote:
      "He didn't just react to the crisis, he took full ownership of the mobile side. Under immense pressure, Nikola anticipated mobile-specific roadblocks, communicated seamlessly across our teams, and delivered swift, reliable solutions that stabilized our core applications and protected the user experience.",
    name: "Nenad Jovanovic",
    title: "Director of Engineering, Paid Media",
    relation: "Worked together on a mission-critical, cross-team incident",
  },
  {
    quote:
      "I'd recommend him to any team as a mobile software engineer without hesitation. Nikola works hard, easy to work with and good at communicating. He gracefully switched between projects, and each time he picked up the new context quickly and was productive right away.",
    name: "Paul Hart",
    title: "Senior Staff Software Engineer, Action Network",
    relation: "Was senior to Nikola on the mobile team",
  },
  {
    quote:
      "Nikola is a reliable React Native engineer who worked across multiple apps and brands. He contributed to bringing several products onto a shared stack, including a full product migration to our target platform. He's easy to work with and always willing to collaborate across teams.",
    name: "Chase West",
    title: "Director of Betting Services, Better Collective",
    relation: "Was senior to Nikola",
  },
  {
    quote:
      "Even as a young developer, Nikola demonstrated qualities that are sometimes hard to find even in much more experienced engineers: reliability, accountability, punctuality, and transparency. He was someone you could always count on to take ownership of his work, communicate openly, and deliver on his commitments.",
    name: "Miloš Novićević",
    title: "CEO, Codeus",
    relation: "Managed Nikola directly",
  },
  {
    quote:
      "Nikola has a really deep understanding of developing and maintaining digital products and as a designer I personally really enjoyed working together with him. He's always very collaborative and open minded when it comes to new ideas and challenges. A true team member you'd want to have by your side.",
    name: "Aleksandar Stanic",
    title: "Senior Digital Designer, Better Collective",
    relation: "Worked with Nikola on the same team",
  },
];

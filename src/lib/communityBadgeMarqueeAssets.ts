export type CommunityMarqueeBadge = {
  id: string;
  label: string;
  asset: number;
};

export const COMMUNITY_BADGE_MARQUEE_ASSETS: CommunityMarqueeBadge[] = [
  {
    id: 'milestone_new_voice',
    label: 'New Voice',
    asset: require('../../assets/badges/027-aniversary.png'),
  },
  {
    id: 'community_neighbourhood_plug',
    label: 'Neighbourhood Plug',
    asset: require('../../assets/badges/007-home.png'),
  },
  {
    id: 'community_hidden_gem_hunter',
    label: 'Hidden Gem Hunter',
    asset: require('../../assets/badges/039-gem.png'),
  },
  {
    id: 'milestone_helpful_honeybee',
    label: 'Helpful Honeybee',
    asset: require('../../assets/badges/030-honeybee.png'),
  },
  {
    id: 'milestone_consistency_star',
    label: 'Consistency Star',
    asset: require('../../assets/badges/031-star.png'),
  },
  {
    id: 'explorer_variety_voyager',
    label: 'Variety Voyager',
    asset: require('../../assets/badges/045-diversity.png'),
  },
];

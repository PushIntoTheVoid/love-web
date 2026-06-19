export interface Note {
  id: string;
  content: string;
  author: string;
  color: 'rose' | 'lavender' | 'amber' | 'mint' | 'blue';
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  description: string;
  iconName: 'Heart' | 'Camera' | 'MapPin' | 'Star' | 'Gift' | 'Plane' | 'Coffee' | 'Flame';
  category: 'firsts' | 'trips' | 'dates' | 'memories';
}

export interface BucketItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface UserProfile {
  name1: string;
  name2: string;
  anniversaryDate: string; // ISO string or YYYY-MM-DD
  theme: 'aurora' | 'solar' | 'forest' | 'synthwave';
  isHeartsEnabled: boolean;
  bgStyle: 'gradient' | 'stars' | 'cherry';
  spotifyUrl: string;
}



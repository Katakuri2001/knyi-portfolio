/**
 * The shape of the content documents.
 *
 * These live here rather than in `content.ts` because the content layer is
 * imported by client components for its types, and the content layer imports
 * the database — which is server-only.
 */

export type CaseStudy = {
  id: string;
  title: string;
  category: string;
  platform: string;
  adSpend?: string | null;
  duration?: string | null;
  audienceGrowth?: string | null;
  orders?: string | null;
  averageOrdersPerMonth?: string | null;
  averageOrderValue?: string | null;
  scope?: string | null;
  reported?: boolean;
  verified?: boolean;
  methodologyNote?: string | null;
  /** Public path of an uploaded image, e.g. "/api/uploads/abc.jpg". */
  image?: string | null;
  /** Description of the uploaded image, used as its alt text. */
  imageAlt?: string | null;
  /** Stored so the frame can reserve space before the image loads (no CLS). */
  imageWidth?: number | null;
  imageHeight?: number | null;
  /** Display order. Items without one fall back to their position. */
  order?: number | null;
};

export type Profile = {
  name: string;
  professionalName: string;
  tagline: string;
  positioning: string;
  background: string;
  howITick: string;
  whatIVALUE: string;
  location: string;
  remoteAvailability: string;
  contact: {
    email: string;
    telegram: string;
    phone: string;
    website: string;
  };
};

export type Services = {
  metaAds: {
    title: string;
    description: string;
    experience: string;
    learning: string;
  };
  contentStrategy: {
    title: string;
    description: string;
    experience: string;
    learning: string;
  };
  marketingAnalysis: {
    title: string;
    description: string;
    experience: string;
    learning: string;
  };
};

export type Tools = {
  practicalExposure: string[];
  currentlyLearning: string[];
};

export type Education = {
  completed: { name: string; institution: string; year: number }[];
  currentlyStudying: { name: string; institution: string }[];
  university: { status: string };
};

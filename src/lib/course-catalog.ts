export type YoungCourseCategory = "core" | "specialized" | "exam";
export type AdultCourseCategory = "professional" | "academic";
export type CourseAudience = "young" | "adult";
export type CourseLandingCategory = YoungCourseCategory | AdultCourseCategory;

export type LandingCourseItem = {
  program: string;
  duration: string;
  gain: string;
  image: string;
  rating: number;
};

export const YOUNG_FALLBACK_COURSES: Record<YoungCourseCategory, LandingCourseItem[]> = {
  core: [
    { program: "Mathematics", duration: "Flexible", gain: "Master concepts from basic arithmetic to advanced algebra and geometry", image: "./Mathematics.png", rating: 4 },
    { program: "Science (KS1-KS3)", duration: "Flexible", gain: "Build curiosity across Biology, Chemistry, and Physics", image: "./Image 01.png", rating: 4 },
    { program: "English Language", duration: "1 year", gain: "Complete grammar, vocabulary, reading, and comprehension skills", image: "./english_class.png", rating: 4 },
  ],
  specialized: [
    { program: "Phonics Mastery", duration: "3 months", gain: "Decode words confidently and read fluently", image: "./Image 02.png", rating: 4 },
    { program: "Creative Writing", duration: "40 weeks", gain: "Express ideas clearly and imaginatively", image: "./Image 03.png", rating: 4 },
    { program: "Public Speaking", duration: "1 year", gain: "Present with confidence and poise", image: "./Image 04.png", rating: 4 },
  ],
  exam: [
    { program: "SAT Preparation", duration: "1 year", gain: "Score higher and unlock university opportunities", image: "./kids_class.png", rating: 4 },
    { program: "11+ Exam Preparation", duration: "1 year", gain: "Ace selective school entrance exams", image: "./IMG.png", rating: 4 },
  ],
};

export const ADULT_FALLBACK_COURSES: Record<AdultCourseCategory, LandingCourseItem[]> = {
  professional: [
    { program: "Spoken English & Personality Development", duration: "9 months", gain: "Speak fluently, command attention, and lead with charisma", image: "./DemoImage.png", rating: 4 },
    { program: "Business Communication", duration: "3 months", gain: "Write professional emails, reports, and presentations", image: "./Educators.png", rating: 4 },
    { program: "Interview Preparation", duration: "3 months", gain: "Land your dream job with proven interview strategies", image: "./About.jpg", rating: 4 },
  ],
  academic: [
    { program: "Advanced Mathematics", duration: "Flexible", gain: "Master calculus, statistics, and higher-level concepts", image: "./Mathematics.png", rating: 4 },
    { program: "Science Subjects", duration: "Flexible", gain: "University-level support in Biology, Chemistry, Physics", image: "./Image 01.png", rating: 4 },
    { program: "English Literature & Writing", duration: "Flexible", gain: "Critical analysis, essay writing, and academic communication", image: "./english_class.png", rating: 4 },
  ],
};

export type LmsLandingCourse = {
  title: string;
  description: string;
  duration: string | null;
  thumbnail_url: string | null;
  rating: number | null;
  audience: CourseAudience | null;
  landing_category: CourseLandingCategory | null;
};

export function buildYoungCourseCatalog(courses: LmsLandingCourse[]) {
  const grouped: Record<YoungCourseCategory, LandingCourseItem[]> = {
    core: [],
    specialized: [],
    exam: [],
  };

  for (const course of courses) {
    if (course.audience !== "young") continue;
    if (!course.landing_category || !(course.landing_category in grouped)) continue;

    grouped[course.landing_category as YoungCourseCategory].push({
      program: course.title,
      duration: course.duration || "Flexible",
      gain: course.description,
      image: course.thumbnail_url || "./Mathematics.png",
      rating: course.rating ?? 4,
    });
  }

  return {
    core: grouped.core.length > 0 ? grouped.core : YOUNG_FALLBACK_COURSES.core,
    specialized: grouped.specialized.length > 0 ? grouped.specialized : YOUNG_FALLBACK_COURSES.specialized,
    exam: grouped.exam.length > 0 ? grouped.exam : YOUNG_FALLBACK_COURSES.exam,
  };
}

export function buildAdultCourseCatalog(courses: LmsLandingCourse[]) {
  const grouped: Record<AdultCourseCategory, LandingCourseItem[]> = {
    professional: [],
    academic: [],
  };

  for (const course of courses) {
    if (course.audience !== "adult") continue;
    if (!course.landing_category || !(course.landing_category in grouped)) continue;

    grouped[course.landing_category as AdultCourseCategory].push({
      program: course.title,
      duration: course.duration || "Flexible",
      gain: course.description,
      image: course.thumbnail_url || "./DemoImage.png",
      rating: course.rating ?? 4,
    });
  }

  return {
    professional: grouped.professional.length > 0 ? grouped.professional : ADULT_FALLBACK_COURSES.professional,
    academic: grouped.academic.length > 0 ? grouped.academic : ADULT_FALLBACK_COURSES.academic,
  };
}

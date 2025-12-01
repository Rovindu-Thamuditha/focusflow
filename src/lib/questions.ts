export type Question = {
  subject: 'Combined Maths' | 'Chemistry' | 'Physics';
  topic: string;
  question: string;
  question_sinhala?: string;
};

export const dailyQuestions: Question[] = [
  {
    subject: 'Combined Maths',
    topic: 'Calculus',
    question: String.raw`\text{Find the derivative of } f(x) = x^2 \sin(x).`,
    question_sinhala: String.raw`f(x) = x^2 \sin(x) \text{ හි ව්‍යුත්පන්නය සොයන්න.}`,
  },
  {
    subject: 'Physics',
    topic: 'Mechanics',
    question: String.raw`\text{A body of mass } 5 \, \text{kg} \text{ accelerates at } 2 \, \text{m/s}^2. \text{ What is the net force?}`,
    question_sinhala: String.raw`\text{ස්කන්ධය } 5 \, \text{kg} \text{ වන වස්තුවක් } 2 \, \text{m/s}^2 \text{ ත්වරණයකින් ගමන් කරයි. ශුද්ධ බලය කුමක්ද?}`,
  },
  {
    subject: 'Chemistry',
    topic: 'Stoichiometry',
    question: String.raw`\text{How many moles are in } 40 \, \text{g of NaOH? (Na=23, O=16, H=1)}`,
    question_sinhala: String.raw`40 \, \text{g NaOH} \text{ වල මවුල කීයක් තිබේද? (Na=23, O=16, H=1)}`,
  },
  {
    subject: 'Combined Maths',
    topic: 'Integration',
    question: String.raw`\text{Evaluate } \int_{0}^{1} (3x^2 + 2x) \,dx.`,
    question_sinhala: String.raw`\int_{0}^{1} (3x^2 + 2x) \,dx \text{ අගයන්න.}`,
  },
  {
    subject: 'Physics',
    topic: 'Electromagnetism',
    question: String.raw`\text{What is the resistance of a wire if a voltage of } 12V \text{ produces a current of } 0.5A?`,
    question_sinhala: String.raw`\text{වෝල්ටීයතාව } 12V \text{ වන විට ධාරාව } 0.5A \text{ නම් කම්බියක ප්‍රතිරෝධය කුමක්ද?}`,
  },
];

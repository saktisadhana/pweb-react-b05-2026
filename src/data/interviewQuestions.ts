export const INTERVIEW_QUESTIONS: string[] = [
  'Ceritakan tentang dirimu dan kenapa kamu tertarik magang di bidang IT.',
  'Jelaskan perbedaan state dan props di React, beserta contoh kapan memakai masing-masing.',
  'Ceritakan bug tersulit yang pernah kamu temui dan bagaimana kamu memperbaikinya.',
  'Bagaimana cara kamu membagi tugas dan berkomunikasi saat kerja kelompok yang deadline-nya mepet?',
  'Apa yang terjadi dari saat kamu mengetik URL di browser sampai halaman tampil?',
  'Proyek mana yang paling kamu banggakan, dan apa yang akan kamu ubah kalau mengulanginya?',
];

// Pertanyaan teknis per skill. Kunci = nama skill huruf kecil (beberapa alias ikut dicek).
const SKILL_QUESTIONS: Record<string, string> = {
  react: 'Kapan sebuah komponen React render ulang, dan bagaimana kamu mencegah render ulang yang tidak perlu?',
  'next.js': 'Apa beda Server Component dan Client Component di Next.js, dan kapan memakai masing-masing?',
  typescript: 'Apa beda type dan interface di TypeScript? Kapan kamu memakai generic?',
  javascript: 'Jelaskan event loop JavaScript: apa yang terjadi dengan Promise dan setTimeout?',
  css: 'Bagaimana cara kamu membuat layout yang responsif? Kapan pakai Flexbox, kapan Grid?',
  'tailwind css': 'Apa kelebihan dan kekurangan Tailwind dibanding menulis CSS sendiri?',
  html: 'Apa itu HTML semantik dan kenapa penting untuk aksesibilitas?',
  'node.js': 'Bagaimana Node.js menangani banyak request sekaligus padahal single-thread?',
  express: 'Bagaimana kamu menyusun middleware dan error handling di Express?',
  python: 'Apa beda list, tuple, dan dictionary di Python, dan kapan memakai masing-masing?',
  django: 'Jelaskan alur request di Django dari URL sampai response.',
  java: 'Jelaskan perbedaan interface dan abstract class di Java.',
  'spring boot': 'Apa itu dependency injection di Spring Boot dan kenapa berguna?',
  go: 'Bagaimana goroutine dan channel dipakai untuk menjalankan tugas secara bersamaan di Go?',
  rust: 'Jelaskan ownership dan borrowing di Rust dengan contoh sederhana.',
  php: 'Bagaimana kamu mencegah SQL injection di aplikasi PHP?',
  laravel: 'Jelaskan Eloquent relationship (hasMany, belongsTo) dengan contoh di Laravel.',
  sql: 'Apa beda INNER JOIN dan LEFT JOIN? Kapan kamu butuh index?',
  postgresql: 'Bagaimana kamu mencari tahu kenapa sebuah query PostgreSQL lambat?',
  mysql: 'Apa itu normalisasi database, dan kapan denormalisasi justru lebih baik?',
  mongodb: 'Kapan kamu memilih MongoDB dibanding database relasional?',
  redis: 'Untuk apa Redis biasanya dipakai, dan apa risikonya kalau dipakai sebagai cache?',
  'rest api': 'Bagaimana kamu mendesain REST API yang rapi: penamaan endpoint, status code, dan versi?',
  graphql: 'Apa kelebihan GraphQL dibanding REST, dan apa masalah N+1 query?',
  docker: 'Apa beda image dan container di Docker? Bagaimana kamu membuat image yang kecil?',
  kubernetes: 'Jelaskan Pod, Deployment, dan Service di Kubernetes.',
  'ci/cd': 'Bagaimana pipeline CI/CD yang baik untuk proyek kelompok kecil?',
  git: 'Bagaimana alur kerja Git kamu di tim: branch, pull request, dan menyelesaikan conflict?',
  linux: 'Perintah Linux apa yang kamu pakai untuk mencari proses yang memakan CPU atau memori?',
  aws: 'Layanan AWS apa yang pernah kamu pakai, dan untuk apa?',
  gcp: 'Bagaimana kamu men-deploy aplikasi di Google Cloud?',
  testing: 'Apa beda unit test, integration test, dan end-to-end test? Mana yang paling sering kamu tulis?',
  cypress: 'Bagaimana kamu membuat test Cypress yang tidak mudah gagal (flaky)?',
  figma: 'Bagaimana alur kerja kamu dari wireframe sampai prototipe di Figma, dan cara serah terima ke developer?',
  'ui/ux': 'Ceritakan keputusan desain yang kamu ubah setelah melihat hasil user testing.',
  flutter: 'Apa beda StatelessWidget dan StatefulWidget di Flutter? Bagaimana kamu mengatur state?',
  kotlin: 'Bagaimana kamu menangani lifecycle Activity/Fragment di Android dengan Kotlin?',
  swift: 'Apa beda struct dan class di Swift?',
  'react native': 'Apa tantangan terbesar membuat aplikasi React Native yang terasa native?',
  'machine learning': 'Bagaimana kamu mendeteksi dan mencegah overfitting pada model?',
  pandas: 'Bagaimana kamu membersihkan data yang punya nilai kosong dan duplikat dengan pandas?',
  'data analysis': 'Ceritakan insight dari data yang pernah kamu temukan dan bagaimana kamu menyampaikannya.',
  security: 'Sebutkan tiga celah keamanan web dari OWASP Top 10 dan cara mencegahnya.',
  networking: 'Apa yang terjadi dari DNS lookup sampai TCP handshake saat membuka sebuah website?',
};

const ALIASES: Record<string, string> = {
  reactjs: 'react', 'react.js': 'react', nextjs: 'next.js', ts: 'typescript', js: 'javascript', es6: 'javascript',
  tailwind: 'tailwind css', node: 'node.js', nodejs: 'node.js', golang: 'go', postgres: 'postgresql',
  'rest': 'rest api', api: 'rest api', k8s: 'kubernetes', ml: 'machine learning', 'ai/ml': 'machine learning',
  'ui design': 'ui/ux', ux: 'ui/ux', 'unit testing': 'testing', jest: 'testing', android: 'kotlin', ios: 'swift',
  owasp: 'security', 'cyber security': 'security',
};

const questionFor = (skill: string) => {
  const key = skill.trim().toLowerCase();
  return SKILL_QUESTIONS[key] ?? SKILL_QUESTIONS[ALIASES[key] ?? ''] ??
    `Ceritakan proyek di mana kamu memakai ${skill}. Masalah apa yang kamu selesaikan dengannya?`;
};

interface InterviewTarget {
  company: string;
  role: string;
  workMode: string;
  requiredSkills: string[];
}

// Soal latihan yang menyesuaikan lowongan: pembuka tentang perusahaan & posisi, satu soal
// teknis per skill yang diminta, soal tentang skill yang belum dikuasai, dan penutup.
export function buildInterviewQuestions(target: InterviewTarget, mySkills: string[] = []): string[] {
  const mine = new Set(mySkills.map((s) => s.toLowerCase()));
  const skills = [...new Set(target.requiredSkills.map((s) => s.trim()).filter(Boolean))];
  const missing = skills.filter((s) => !mine.has(s.toLowerCase()));
  const questions = [
    `Kenapa kamu tertarik dengan posisi ${target.role} di ${target.company}?`,
    ...skills.slice(0, 6).map(questionFor),
  ];
  if (missing.length > 0) {
    questions.push(`Lowongan ini meminta ${missing.slice(0, 3).join(', ')}, yang belum ada di profil skill kamu. Bagaimana rencana kamu mempelajarinya dengan cepat?`);
  }
  if (target.workMode === 'Remote') {
    questions.push('Posisi ini remote. Bagaimana kamu menjaga komunikasi dan tetap produktif tanpa bertemu langsung?');
  } else {
    questions.push('Ceritakan saat kamu bekerja dalam tim dengan deadline mepet. Apa peran kamu?');
  }
  questions.push('Apa yang ingin kamu tanyakan ke kami tentang tim atau proyeknya?');
  return [...new Set(questions)]; // dua skill bisa menghasilkan soal yang sama (misal React dan ReactJS)
}

import sathvikPortrait from "@/assets/founders/sathvik-putta.png";

export interface Degree {
  level: string;
  field: string;
  institution: string;
  country: string;
  year?: string;
}

export interface Founder {
  id: string;
  name: string;
  role: string;
  title: string;
  photo: string;
  /** CSS object-position for circular crops when default center crops the face oddly */
  photoPosition?: string;
  bio: string[];
  degrees: Degree[];
  expertise: string[];
  linkedin?: string;
  github?: string;
  email?: string;
}

export const founders: Founder[] = [
  {
    id: "onarjae-bonhometre",
    name: "Onarjae Bonhometre",
    role: "Founder & AI Researcher",
    title: "AI & Agentic AI Educator · MBA (AI Specialization)",
    photo: "/images/founders/RJ_profile.png",
    bio: [
      "Onarjae Bonhometre is the founder of GenValue and an AI researcher focused on practical Artificial Intelligence and Agentic AI applications. Currently pursuing an MBA with an AI Specialization at Sacred Heart University, he combines a strong Information Technology background with hands-on experience to help bridge the gap between AI theory and real-world implementation.",
      "His work emphasizes Large Language Models, AI integration, and making complex AI concepts accessible for learners and professionals alike.",
    ],
    degrees: [
      {
        level: "MBA",
        field: "Artificial Intelligence (AI Specialization)",
        institution: "Sacred Heart University",
        country: "United States",
      },
      {
        level: "Bachelor's Degree",
        field: "Information Technology",
        institution: "Sacred Heart University",
        country: "United States",
      },
    ],
    expertise: [
      "Artificial Intelligence (AI)",
      "Agentic AI",
      "AI Integration",
      "Ethical & Responsible AI",
      "AI Governance",
      "Large Language Models (LLMs)",
    ],
    email: "genvalue.academy@gmail.com",
    linkedin: "https://www.linkedin.com/in/onarjae-bonhometre-03304022a/",
  },
  {
    id: "sathvik-putta",
    name: "Sathvik Putta",
    role: "Co-Founder & Instructor",
    title: "AI/ML Engineer · Generative AI & Data Science",
    photo: sathvikPortrait.src,
    bio: [
      "Sathvik Putta serves as the Co-Founder and Instructor of GenValue, bringing expertise in Artificial Intelligence, Machine Learning, and Data Science. With professional experience in enterprise AI, Generative AI, Retrieval-Augmented Generation (RAG), and MLOps, he specializes in designing scalable AI solutions, developing machine learning pipelines, and deploying production-ready intelligent systems.",
      "His passion for translating complex AI concepts into practical applications enables learners to build industry-relevant skills while solving real-world business challenges.",
    ],
    degrees: [
      {
        level: "Master of Science",
        field: "Computer Science – Data Science",
        institution: "Sacred Heart University",
        country: "United States",
      },
      {
        level: "Bachelor of Engineering",
        field: "Computer Science",
        institution: "Saveetha School of Engineering",
        country: "India",
      },
    ],
    expertise: [
      "Generative AI",
      "Retrieval-Augmented Generation (RAG)",
      "Large Language Models (LLMs)",
      "MLOps",
      "Google Cloud Platform (GCP)",
      "Data Science",
    ],
    linkedin: "https://www.linkedin.com/in/sathvik-putta-7612611a4/",
    github: "https://github.com/PuttaSathvik16",
    email: "genvalue.academy@gmail.com",
  },
  {
    id: "srilakshmi-k",
    name: "Srilakshmi K.",
    role: "Chief Product Officer & Instructor",
    title: "AI/ML Engineer · Generative AI & Healthcare Analytics",
    photo: "/images/founders/srilakshmi_profile.png",
    bio: [
      "Srilakshmi K. serves as the Chief Product Officer and Instructor, bringing expertise in Artificial Intelligence, Machine Learning, and healthcare data analytics. With hands-on experience developing production-grade AI solutions, Retrieval-Augmented Generation (RAG) applications, agentic workflows, and machine learning pipelines, she combines strong technical knowledge with practical implementation.",
      "Her background in AI engineering, data engineering, and enterprise analytics enables her to design scalable AI solutions while mentoring learners in modern AI technologies and real-world applications.",
    ],
    degrees: [
      {
        level: "Master of Science",
        field: "Computer Science",
        institution: "University of Central Missouri",
        country: "United States",
      },
      {
        level: "Bachelor of Technology",
        field: "Information Technology",
        institution: "Sree Vidyanikethan Education Trust",
        country: "India",
      },
    ],
    expertise: [
      "Large Language Models (LLMs)",
      "Retrieval-Augmented Generation (RAG)",
      "Generative AI",
      "AI/ML Engineering",
      "Healthcare Data Analytics",
      "Amazon Web Services (AWS)",
    ],
    linkedin: "https://www.linkedin.com/in/kokantisrilakshmi/",
    github: "https://github.com/srilakshmi-k25",
    email: "genvalue.academy@gmail.com",
  },
  {
    id: "sandhya-l",
    name: "Sandhya L",
    role: "Chief Product Officer & Instructor",
    title: "Senior Business Analyst · Data Science & Business Systems",
    photo: "/images/founders/Sandhya_profile.png",
    // Shift crop down so forehead / hair stay inside the circle
    photoPosition: "50% 22%",
    bio: [
      "Sandhya L serves as the Chief Product Officer and Instructor, bringing over five years of experience in business analysis, data science, and enterprise technology. She specializes in bridging the gap between business and technology by translating complex requirements into scalable, data-driven solutions.",
      "With expertise in Agile methodologies, SQL, Power BI, business systems analysis, and stakeholder collaboration, she combines analytical thinking with practical implementation to help organizations improve operational efficiency and deliver successful digital transformation initiatives.",
    ],
    degrees: [
      {
        level: "Master's Degree",
        field: "Data Science",
        institution: "University of New Haven",
        country: "United States",
      },
      {
        level: "Bachelor's Degree",
        field: "Computer Science",
        institution: "Guru Nanak Institutions",
        country: "India",
      },
    ],
    expertise: [
      "Business Analysis",
      "Business Systems Analysis",
      "Agile & Scrum",
      "SQL",
      "Microsoft Power BI",
      "Project Management",
    ],
    linkedin: "https://www.linkedin.com/in/sandhyal1/",
    email: "genvalue.academy@gmail.com",
  },
  {
    id: "sujith-putta",
    name: "Sujith Putta",
    role: "Chief Technology Officer & Platform Administrator",
    title: "Generative AI Engineer · Full Stack Developer",
    photo: "/images/founders/sujith-putta.png",
    bio: [
      "Sujith Putta serves as the Chief Technology Officer and Platform Administrator, leading the development and technical operations of the platform. Passionate about Generative AI, Machine Learning, and scalable software systems, he specializes in building AI-powered applications, Retrieval-Augmented Generation (RAG) solutions, multi-agent systems, and modern full-stack web applications.",
      "With a strong focus on innovation, user experience, and platform architecture, he is dedicated to developing reliable AI solutions that solve real-world problems while driving continuous technological advancement.",
    ],
    degrees: [
      {
        level: "Bachelor of Technology",
        field: "Computer Science & Technology",
        institution: "Dayananda Sagar University",
        country: "India",
      },
    ],
    expertise: [
      "Generative AI",
      "Machine Learning",
      "Retrieval-Augmented Generation (RAG)",
      "Multi-Agent Systems",
      "Stable Diffusion",
      "PyTorch",
      "LoRA (Low-Rank Adaptation)",
      "Full Stack Development",
    ],
    linkedin: "https://www.linkedin.com/in/sujith-putta-13257a322/",
    github: "https://github.com/sujithputta02",
    email: "genvalue.academy@gmail.com",
  },
  {
    id: "vishnu-swarup-pujari",
    name: "Vishnu Swarup Pujari",
    role: "Employee",
    title: "Data Analyst & AI Engineer · Data Analytics · Generative AI · Full Stack Development",
    photo: "/images/founders/Vishnu_profile.png",
    bio: [
      "Vishnu Swarup Pujari is a Data Analyst and AI-focused professional with experience in data analytics, AI engineering, and full-stack development. His work includes building ETL pipelines, developing Power BI dashboards, performing data validation and root cause analysis, and researching advanced Retrieval-Augmented Generation (RAG) systems. With experience across Python, SQL, machine learning, backend development, and cloud technologies, he brings together data and software engineering to build practical, intelligent applications.",
    ],
    degrees: [
      {
        level: "Master of Science",
        field: "Computer Science",
        institution: "University of South Florida",
        country: "United States",
      },
    ],
    expertise: [
      "Data Analytics",
      "Generative AI",
      "Retrieval-Augmented Generation (RAG)",
      "Machine Learning",
      "SQL & Data Engineering",
      "Power BI",
      "Full Stack Development",
    ],
    linkedin: "https://www.linkedin.com/in/vishnu-swarup-pujari-ab76661b9/",
    github: "https://github.com/vishnu322010326030",
    email: "genvalue.academy@gmail.com",
  },
  {
    id: "tejaswini-varampati",
    name: "Tejaswini Varampati",
    role: "Employee",
    title: "Data Analyst & AI Enthusiast · Data Science · Machine Learning · Full-Stack Development",
    photo: "/images/founders/Tejaswini_profile.png",
    bio: [
      "Tejaswini Varampati is a Computer Science graduate student at the University of South Florida with a focus on Data, AI, and software development. Her experience spans Data Analytics, Machine Learning, Python, SQL, and Full-Stack Development. She has worked on projects involving face detection and recognition, chatbots, machine learning classifiers, data science, and survey and quiz management systems. She has also contributed as a Student Ambassador and Student Placement Coordinator, gaining exposure to industry technologies and professional collaboration.",
    ],
    degrees: [
      {
        level: "Master of Science",
        field: "Computer Science",
        institution: "University of South Florida",
        country: "United States",
      },
      {
        level: "Bachelor of Technology",
        field: "Computer Science · Data Science",
        institution: "GITAM Deemed University",
        country: "India",
      },
    ],
    expertise: [
      "Data Analytics",
      "Machine Learning",
      "Data Science",
      "Full-Stack Development",
      "Python",
      "SQL",
      "Cloud Storage",
    ],
    linkedin: "https://www.linkedin.com/in/tejaswini-varampati-6517a51b8/",
    github: "https://github.com/vtejaswin1",
    email: "genvalue.academy@gmail.com",
  },
];

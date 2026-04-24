export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  github: string;
  link?: string;
  isExternal?: boolean;
  tags: string[];
  order: number;
}

export const initialProjects: Project[] = [];

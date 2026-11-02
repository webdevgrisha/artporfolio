import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";

import type { Project } from "../model/project";

interface ProjectCoverProps {
  /** The size of the cover; the empty place of a project without photos keeps it too. */
  className?: string;
  project: Project;
}

/** The first photo of the project, which lists show by its title. */
export function ProjectCover({ className, project }: ProjectCoverProps) {
  const [cover] = project.photos;

  return cover ? (
    <MediaImage className={className} source={imageToMediaItem(cover).source} />
  ) : (
    <span className={className} />
  );
}

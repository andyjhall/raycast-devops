export type AdoGitrepostitoriesResponse = {
  value: Repository[];
};

export type AdoProjectResponse = {
  value: Project[];
};

export type AdoPrResponse = {
  value: PullRequest[];
};

export type Repository = {
  id: string;
  name: string;
  url: string;
  defaultBranch: string;
  project: Project;
  remoteUrl: string;
  sshUrl: string;
  webUrl: string;
  isDisabled: boolean;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  url: string;
  projectUrl: string;
};

export type PullRequest = {
  repository: Repository;
  pullRequestId: string;
  codeReviewId: string;
  status: string;
  creationDate: string;
  title: string;
  description: string;
  sourceRefName: string;
  targetRefName: string;
  mergeStatus: string;
  url: string;
  supportsIterations: boolean;
  isDraft: boolean;
  createdBy: CreatedBy;
  reviewers: Reviewer[];
};

export type CreatedBy = {
  id: string;
  displayName: string;
  imageUrl: string;
};

export type Reviewer = {
  id: string;
  displayName: string;
  imageUrl: string;
  vote: number;
};
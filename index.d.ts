// Type definitions for Now-Github 1.0.0
// Project: Now-Github
// Definitions by: Cody Morrison <[~A URL FOR YOU~]>

export = GithubAuth;

export interface GithubAuthOptions {
  githubUrl?: string;
}

declare class GithubAuth {
  constructor(
    clientId: string,
    clientSecret: string,
    options?: GithubAuthOptions
  );

  clientId: string;
  githubUrl: string;
  clientState: string | null;

  login(req: object, res: object): void;
  callback(req: object, res: object): void;
  clientRedirect(res: object, params: object);
}

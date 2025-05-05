import { Octokit } from "octokit";
import { useEffect, useReducer, useState } from "react";
import { Actions } from "./action";
import { Endpoints } from "@octokit/types";

export type Action =
  | {
      repo: string;
      action: "archived" | "private" | "remove";
    }
  | {
      repo: string;
      name: string;
      action: "rename";
    }
  | {
      repo: string;
      action: "description";
      description: string;
    }
  | {
      action: "reset";
    };

export type Repo = Endpoints["GET /user/repos"]["response"]["data"][0];

async function getAllRepos(octokit: Octokit): Promise<Repo[]> {
  return octokit.paginate(`GET /user/repos?sort=created`, {
    "X-GitHub-Api-Version": "2022-11-28",
  });
}

export function useRepos(octokit: Octokit) {
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    getAllRepos(octokit).then(setRepos).catch(console.error);
  }, [octokit]);

  const getRepo = (name: string) => repos.find((r) => r.full_name === name);

  const [actions, updateActions] = useReducer(
    (actions: Actions, action: Action) => {
      if (action.action == "reset") {
        return {
          rename: {},
          archived: {},
          private: {},
          remove: {},
          description: {},
        };
      }

      const s = { ...actions };

      const repo = getRepo(action.repo);
      switch (action.action) {
        case "rename":
          s.rename[action.repo] = action.name;
          if (action.name == repo?.full_name) delete s.rename[action.repo];
          break;
        case "private":
          const isPrivate =
            action.repo in s.private ? !s.private[action.repo] : !repo?.private;
          s.private[action.repo] = isPrivate;
          if (isPrivate == repo?.private) delete s.private[action.repo];
          break;
        case "archived":
          const archived =
            action.repo in s.archived
              ? !s.archived[action.repo]
              : !repo?.archived;
          s.archived[action.repo] = archived;
          if (archived == repo?.archived) delete s.archived[action.repo];
          break;
        case "remove":
          const remove =
            action.repo in s.remove ? !s.remove[action.repo] : true;
          s.remove[action.repo] = remove;
          if (remove == false) {
            delete s.remove[action.repo];
          }
          break;
        case "description":
          s.description[action.repo] = action.description;
          if (action.description == repo?.description) {
            delete s.description[action.repo];
          }
          break;
        default:
          console.error("unknown action:", action);
      }

      return s;
    },
    {
      rename: {},
      archived: {},
      private: {},
      remove: {},
      description: {},
    },
  );

  const toggleIsArchive = (repo: Repo) => {
    updateActions({
      repo: repo.full_name,
      action: "archived",
    });
  };

  const toggleIsPrivate = (repo: Repo) => {
    updateActions({
      repo: repo.full_name,
      action: "private",
    });
  };

  const rename = (repo: Repo, name: string) => {
    const owner = repo.full_name.split("/")[0];
    updateActions({
      repo: repo.full_name,
      name: `${owner}/${name}`,
      action: "rename",
    });
  };

  const remove = (repo: Repo) => {
    updateActions({
      repo: repo.full_name,
      action: "remove",
    });
  };

  const reset = () => {
    updateActions({ action: "reset" });
  };

  const setDescription = (repo: Repo, description: string) => {
    updateActions({
      repo: repo.full_name,
      action: "description",
      description,
    });
  };

  return [
    repos,
    actions,
    {
      toggleIsArchive,
      toggleIsPrivate,
      rename,
      remove,
      setDescription,
      reset,
    },
  ] as const;
}

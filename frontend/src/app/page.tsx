"use client";
import React, { useEffect, useState } from "react";
import { Octokit } from "octokit";
import { useRepos } from "./useRepos";
import { composeMsg, doAction } from "./action";
import { useFiltering } from "./useFiltering";
import { Loading } from "./Loading";
import { Cell, Row } from "./grid";
import { useSearchParams } from "next/navigation";

const clientID = "Ov23liTnLPEPqqDWdFcE";

export default function Page() {
  const [octokit, setOctokit] = useState<Octokit | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      fetch("/auth/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          const octokit = new Octokit({ auth: data.access_token });
          setOctokit(octokit);
        })
        .then(() => {
          if (!window) return;
          window.history.replaceState(null, "", "/");
        })
        .catch((e) => {
          alert("登入失敗，錯誤訊息在 Console");
          console.error(e);
        });
    }
  }, [searchParams]);

  if (!octokit) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="w-full max-w-md rounded-lg bg-gray-50 p-6 text-center shadow-md">
          <p className="mb-4 text-lg">請使用 GitHub 登入：</p>
          <a
            href={`https://github.com/login/oauth/authorize?client_id=${clientID}&scope=repo+delete_repo`}
            className="inline-block rounded bg-black px-4 py-2 text-white"
          >
            使用 GitHub 登入
          </a>
        </div>
      </div>
    );
  }

  return <WithOctokit octokit={octokit} />;
}

function WithOctokit({ octokit }: { octokit: Octokit }) {
  const [repos, actions, action] = useRepos(octokit);
  const { Filtering, filter } = useFiltering();

  if (repos.length == 0)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loading />
      </div>
    );

  const submit = () =>
    confirm(composeMsg(actions)) &&
    confirm("確定要執行？不可回復喔！") &&
    confirm("真的嗎？這是最後一次確認") &&
    doAction(octokit, actions)
      .then(() =>
        alert("ok，請自己重新整理頁面，有時候要稍等一下才會抓到最新狀態"),
      )
      .then(action.reset)
      .catch((e) => {
        alert("error\n" + e.message);
        console.error(e);
      });

  return (
    <div className="m-8">
      <p>雙擊文字可以修改</p>
      <div className="flex flex-col border">
        {Filtering}
        {filter(repos).map((repo) => (
          <Row key={repo.id}>
            <Cell
              action={() => {
                // TODO: a virtual layar to get modified property of repo
                const name = repo.full_name.split("/")[1];
                action.rename(repo, prompt(`Rename ${name}`, name) || name);
              }}
            >
              <h2>
                <a
                  href={repo.html_url}
                  target="_blank"
                  className="underline-offset-4 hover:underline-offset-2"
                >
                  {repo.full_name}
                </a>
                <br />
                {repo.full_name in actions.rename && (
                  <span className="font-bold text-red-500">
                    -&gt;{actions.rename[repo.full_name]}
                  </span>
                )}
              </h2>
            </Cell>
            <Cell
              action={() => {
                action.setDescription(
                  repo,
                  prompt(`Set Description`, repo.description || "") ||
                    repo.description ||
                    "",
                );
              }}
            >
              <p>
                {repo.description}
                <br />
                {repo.full_name in actions.description && (
                  <span className="font-bold text-red-500">
                    -&gt;{actions.description[repo.full_name]}
                  </span>
                )}
              </p>
            </Cell>
            <Cell action={() => action.toggleIsPrivate(repo)}>
              <p>
                {repo.private ? "Private" : "Public"}
                <br />
                {repo.full_name in actions.private && (
                  <span className="font-bold text-red-500">
                    -&gt;
                    {actions.private[repo.full_name] ? "Private" : "Public"}
                  </span>
                )}
              </p>
            </Cell>
            <Cell action={() => action.toggleIsArchive(repo)}>
              <p>
                {repo.archived ? "Archived" : "Unarchived"}
                <br />
                {repo.full_name in actions.archived && (
                  <span className="font-bold text-red-500">
                    -&gt;
                    {actions.archived[repo.full_name]
                      ? "Archived"
                      : "Unarchived"}
                  </span>
                )}
              </p>
            </Cell>
            <Cell action={() => action.remove(repo)}>
              {repo.full_name in actions.remove && (
                <p className="font-bold text-red-500">Removed</p>
              )}
            </Cell>
          </Row>
        ))}
      </div>
      <div className="flex w-full gap-4">
        <button
          className="my-2 grow rounded-lg border p-2"
          type="button"
          onClick={action.reset}
        >
          Reset
        </button>
        <button
          className="my-2 grow rounded-lg border p-2"
          type="button"
          onClick={submit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

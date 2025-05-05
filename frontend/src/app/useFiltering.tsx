import { useReducer, useState, useCallback } from "react";
import { Row, Cell } from "./grid";
import { Repo } from "./useRepos";

const privateState = ["all", "private", "public"];
const archivedState = ["all", "archived", "unarchived"];

function useName() {
  const [name, setName] = useState("");

  const Name = (
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Filter by name(regex)"
      className="w-full rounded border p-1 break-all"
    />
  );

  return { Name, name };
}

export function useFiltering() {
  const { name, Name } = useName();
  const [isPrivate, togglePrivate] = useReducer(
    (state: number) => (state + 1) % 3,
    0,
  );
  const [archived, toggleArchived] = useReducer(
    (state: number) => (state + 1) % 3,
    0,
  );

  const Filtering = (
    <Row>
      <Cell>{Name}</Cell>
      <Cell />
      <Cell action={togglePrivate}>{privateState[isPrivate]}</Cell>
      <Cell action={toggleArchived}>{archivedState[archived]}</Cell>
      <Cell>Remove</Cell>
    </Row>
  );

  const filter = useCallback(
    (repos: Repo[]) => {
      const conditions: ((repo: Repo) => boolean)[] = [
        // by name
        (repo: Repo) => !!repo.full_name.match(name),
        // by private
        (repo: Repo) =>
          archived === 0 || (archived === 1 ? repo.archived : !repo.archived),
        // by archived
        (repo: Repo) =>
          isPrivate === 0 || (isPrivate === 1 ? repo.private : !repo.private),
      ];

      return repos.filter((repo: Repo) => conditions.every((c) => c(repo)));
    },
    [name, archived, isPrivate],
  );

  return { Filtering, filter };
}

import { useReducer } from "react";
import { Row, Cell } from "./grid";
import { Repo } from "./useRepos";

const privateState = ["all", "private", "public"];
const archivedState = ["all", "archived", "unarchived"];

export function useFiltering() {
  const [isPrivate, togglePrivate] = useReducer((state: number) => {
    return (state + 1) % 3;
  }, 0);
  const [archived, toggleArchived] = useReducer((state: number) => {
    return (state + 1) % 3;
  }, 0);

  // return [filtering, setFiltering] as const;
  const Filtering = () => (
    <Row>
      <Cell />
      <Cell />
      <Cell action={togglePrivate}>{privateState[isPrivate]}</Cell>
      <Cell action={toggleArchived}>{archivedState[archived]}</Cell>
      <Cell />
    </Row>
  );

  const filter = (repos: Repo[]) =>
    repos
      .filter(
        (repo) =>
          isPrivate === 0 || (isPrivate === 1 ? repo.private : !repo.private),
      )
      .filter(
        (repo) =>
          archived === 0 || (archived === 1 ? repo.archived : !repo.archived),
      );

  return { Filtering, filter };
}

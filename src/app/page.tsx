'use client'
import React, { useState } from 'react'
import { Octokit } from 'octokit'
import { useRepos } from './useRepos'
import { useLocalStorage } from 'usehooks-ts'
import { composeMsg, doAction } from './action'
import { useFiltering } from './useFiltering'

function Cell({ children, action }: { children?: React.ReactNode; action?: () => void }) {
	return (
		<div className="bg-white p-2" onClick={action}>
			{children}
		</div>
	)
}

export default function Page() {
	const [octokit, setOctokit] = useState<Octokit>()
	const [token, setToken] = useLocalStorage('token', '')

	if (!octokit)
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<input
					type="text"
					value={token}
					onChange={e => setToken(e.target.value)}
					placeholder="Enter your GitHub token"
					className="border rounded-lg p-2 my-2"
				/>
				<button
					className="border rounded-lg p-2 my-2"
					type="button"
					onClick={() => {
						try {
							const octokit = new Octokit({ auth: token })
							console.log(octokit)
							octokit.auth()
							octokit.rest.users.getAuthenticated().then(() => {
								setOctokit(octokit)
							})
						} catch {
							alert('Invalid token')
						}
					}}
				>
					Auth
				</button>
			</div>
		)

	return <WithOctokit octokit={octokit} />
}

function WithOctokit({ octokit }: { octokit: Octokit }) {
	const [repos, actions, action] = useRepos(octokit)
	const [filtering, setFiltering] = useFiltering()

	if (repos.length == 0)
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<h1 className="text-2xl">Loading...</h1>
			</div>
		)

	return (
		<div className="m-8">
			<div className="grid grid-cols-[2fr_2fr_6rem_8rem_6rem] gap-0.5 bg-black border-2">
				<Cell />
				<Cell />
				<Cell action={() => setFiltering('private')}>
					{filtering.private == undefined ? 'all' : filtering.private ? 'private' : 'public'}
				</Cell>
				<Cell action={() => setFiltering('archived')}>
					{filtering.archived == undefined ? 'all' : filtering.archived ? 'archived' : 'unarchived'}
				</Cell>
				<Cell />

				{repos
					.filter(repo => {
						if (filtering.private != undefined) return repo.private == filtering.private
						if (filtering.archived != undefined) return repo.archived == filtering.archived
						return true
					})
					.map(repo => (
						<>
							<Cell
								action={() => {
									const name = repo.full_name.split('/')[1]
									action.rename(repo, prompt(`Rename ${name}`, name) || name)
								}}
							>
								<h2>
									{repo.full_name}
									<br />
									{repo.full_name in actions.rename && (
										<span className="text-red-500 font-bold">
											-&gt;{actions.rename[repo.full_name]}{' '}
										</span>
									)}
								</h2>
							</Cell>
							<Cell>
								<p>{repo.description}</p>
							</Cell>
							<Cell action={() => action.toggleIsPrivate(repo)}>
								<p>
									{repo.private ? 'Private' : 'Public'}
									<br />
									{repo.full_name in actions.private && (
										<span className="text-red-500 font-bold">
											-&gt;{actions.private[repo.full_name] ? 'Private' : 'Public'}{' '}
										</span>
									)}
								</p>
							</Cell>
							<Cell action={() => action.toggleIsArchive(repo)}>
								<p>
									{repo.archived ? 'Archived' : 'Unarchived'}
									<br />
									{repo.full_name in actions.archived && (
										<span className="text-red-500 font-bold">
											-&gt;
											{actions.archived[repo.full_name] ? 'Archived' : 'Unarchived'}{' '}
										</span>
									)}
								</p>
							</Cell>
							<Cell action={() => action.remove(repo)}>
								{repo.full_name in actions.remove && <p className="text-red-500 font-bold">Removed</p>}
							</Cell>
						</>
					))}
			</div>
			<button
				className="w-full border rounded-lg p-2 my-2"
				type="button"
				onClick={() =>
					// TODO: 組合出會做哪些更動
					confirm(composeMsg(actions)) &&
					confirm('確定要執行？不可回復喔！') &&
					confirm('真的嗎？這是最後一次確認') &&
					doAction(octokit, actions)
						.then(() => alert('ok，請自己重新整理頁面，有時候要稍等一下才會抓到最新狀態'))
						.then(action.reset)
						.catch(e => {
							alert('error\n' + e.message)
							console.error(e)
						})
				}
			>
				Submit
			</button>
		</div>
	)
}

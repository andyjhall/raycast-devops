import { Action, ActionPanel, List, Icon, Color } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { preparedPersonalAccessToken, baseApiUrl } from "./preferences";
import { AdoPrResponse, AdoPrThreadsResponse, PullRequest } from "./types";
import { useEffect, useState } from "react";

const getPullRequestIcon = (pullreq: PullRequest) => {
  if (pullreq.isDraft) {
    return { source: Icon.Pencil, tintColor: Color.Red };
  }

  // approved
  if (pullreq.reviewers.some((reviewer) => reviewer.vote === 10)) {
    return { source: Icon.Check, tintColor: Color.Green };
  }

  // approved with suggestions
  if (pullreq.reviewers.some((reviewer) => reviewer.vote === 5)) {
    return { source: Icon.Check, tintColor: Color.Orange };
  }

  // 0 = unapproved
  return { source: "pull-request-open-unread.svg", tintColor: Color.Purple };
};

const getPullRequestUrl = (pullreq: PullRequest) =>
  `${baseApiUrl()}/${pullreq.repository.project.name}/_git/${pullreq.repository.name}/pullrequest/${pullreq.pullRequestId}`;

const getPullRequestSortOrder = (pullreq: PullRequest) => {
  if (pullreq.isDraft) {
    return 2;
  }

  if (pullreq.reviewers.some((reviewer) => reviewer.vote === 10 || reviewer.vote === 5)) {
    return 1;
  }

  return 0;
};

export default () => {
  const headers = { Accept: "application/json", Authorization: `Basic ${preparedPersonalAccessToken()}` };
  const { data, isLoading } = useFetch<AdoPrResponse>(`${baseApiUrl()}/_apis/git/pullrequests?api-version=6.0`, {
    headers,
  });

  const [query, setQuery] = useState("");
  const [pullRequestsWithActiveComments, setPullRequestsWithActiveComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isCancelled = false;

    async function fetchActiveCommentThreads() {
      if (!data?.value.length) {
        setPullRequestsWithActiveComments({});
        return;
      }

      const pullRequestActiveCommentEntries = await Promise.all(
        data.value.map(async (pullreq) => {
          try {
            const response = await fetch(
              `${baseApiUrl()}/${pullreq.repository.project.name}/_apis/git/repositories/${pullreq.repository.id}/pullRequests/${pullreq.pullRequestId}/threads?api-version=7.1`,
              { headers },
            );

            if (!response.ok) {
              return [pullreq.pullRequestId, false] as const;
            }

            const threadData = (await response.json()) as AdoPrThreadsResponse;

            return [
              pullreq.pullRequestId,
              threadData.value.some((thread) => !thread.isDeleted && thread.status === "active"),
            ] as const;
          } catch {
            return [pullreq.pullRequestId, false] as const;
          }
        }),
      );

      if (!isCancelled) {
        setPullRequestsWithActiveComments(Object.fromEntries(pullRequestActiveCommentEntries));
      }
    }

    fetchActiveCommentThreads();

    return () => {
      isCancelled = true;
    };
  }, [data]);

  // Extract search type and term
  const searchMatch = query.match(/^!(id|title|repo|user)\s+(.+)/i);
  const searchType = searchMatch?.[1]?.toLowerCase();
  const searchTerm = searchMatch?.[2]?.toLowerCase() ?? query;

  const filteredPRs = data?.value
    .filter((pullreq) => {
      switch (searchType) {
        case "id":
          return pullreq.pullRequestId.toString().includes(searchTerm);
        case "title":
          return pullreq.title.toLowerCase().includes(searchTerm);
        case "repo":
          return pullreq.repository.name.toLowerCase().includes(searchTerm);
        case "user":
          return pullreq.createdBy.displayName.toLowerCase().includes(searchTerm);
        default:
          return (
            pullreq.pullRequestId.toString().includes(searchTerm) ||
            pullreq.title.toLowerCase().includes(searchTerm) ||
            pullreq.repository.name.toLowerCase().includes(searchTerm) ||
            pullreq.createdBy.displayName.toLowerCase().includes(searchTerm)
          );
      }
    })
    .sort((left, right) => getPullRequestSortOrder(left) - getPullRequestSortOrder(right));

  return (
    <List isLoading={isLoading} onSearchTextChange={setQuery}>
      {filteredPRs?.map((pullreq) => (
        <List.Item
          icon={getPullRequestIcon(pullreq)}
          key={pullreq.pullRequestId}
          title={`${pullreq.pullRequestId} - ${pullreq.title}`}
          subtitle={pullreq.repository.name}
          accessories={[
            ...(pullRequestsWithActiveComments[pullreq.pullRequestId]
              ? [{ icon: { source: Icon.SpeechBubbleActive, tintColor: Color.Orange } }]
              : []),
            {
              tag: pullreq.createdBy.displayName,
              icon: { source: Icon.Person },
            },
          ]}
          keywords={[
            pullreq.createdBy.displayName.split(" ")[0],
            pullreq.createdBy.displayName.split(" ")[1],
            pullreq.repository.name,
          ]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Open in Browser" url={getPullRequestUrl(pullreq)} />
              <Action.CopyToClipboard
                title="Copy Pull Request URL"
                content={getPullRequestUrl(pullreq)}
                icon={Icon.CopyClipboard}
                shortcut={{ modifiers: ["cmd"], key: "." }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
};
